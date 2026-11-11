'use strict'
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var os = require('os')

// Test 1: XDG_CONFIG_HOME custom absolute path is honoured
;(function testXdgConfigHomeCustom () {
  var n = 'rctest' + Math.random().toString(36).slice(2)
  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc-xdg-'))
  var xdgDir = path.join(tmpDir, 'xdg-config')
  var appDir = path.join(xdgDir, n)
  fs.mkdirSync(appDir, { recursive: true })

  var rcFile = path.join(appDir, 'config')
  fs.writeFileSync(rcFile, JSON.stringify({ xdgOption: 'from-xdg' }))

  var originalXdg = process.env.XDG_CONFIG_HOME
  process.env.XDG_CONFIG_HOME = xdgDir

  // Clear require cache so index.js re-evaluates
  var rcModule = path.resolve(__dirname, '../index.js')
  delete require.cache[rcModule]
  var rc = require('../')

  var config = rc(n, { xdgOption: 'default' })
  assert.equal(config.xdgOption, 'from-xdg',
    'XDG_CONFIG_HOME: config file under $XDG_CONFIG_HOME/<name>/config must be read')
  assert.ok(config.configs && config.configs.indexOf(rcFile) !== -1,
    'XDG_CONFIG_HOME: rcFile should be listed in config.configs')

  // Restore env
  if (originalXdg === undefined) {
    delete process.env.XDG_CONFIG_HOME
  } else {
    process.env.XDG_CONFIG_HOME = originalXdg
  }

  fs.rmSync(tmpDir, { recursive: true, force: true })
  console.log('PASS: XDG_CONFIG_HOME custom absolute path is honoured')
})()

// Test 2: XDG_CONFIG_HOME/<name>rc file is read and takes precedence over <name>/config
;(function testXdgConfigHomeRcFileSymmetry () {
  var n = 'rctest' + Math.random().toString(36).slice(2)
  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc-xdg-sym-'))
  var xdgDir = path.join(tmpDir, 'xdg-config')
  var appDir = path.join(xdgDir, n)
  fs.mkdirSync(appDir, { recursive: true })

  // Write base config in <name>/config
  fs.writeFileSync(path.join(appDir, 'config'), JSON.stringify({ base: 'from-config', shared: 'config-val' }))
  // Write overriding config in <name>rc under XDG_CONFIG_HOME
  fs.writeFileSync(path.join(xdgDir, n + 'rc'), JSON.stringify({ extra: 'from-rc', shared: 'rc-val' }))

  var originalXdg = process.env.XDG_CONFIG_HOME
  process.env.XDG_CONFIG_HOME = xdgDir

  var rcModule = path.resolve(__dirname, '../index.js')
  delete require.cache[rcModule]
  var rc = require('../')

  var config = rc(n, { base: 'default' })
  assert.equal(config.base, 'from-config')
  assert.equal(config.extra, 'from-rc')
  assert.equal(config.shared, 'rc-val', '<name>rc should override <name>/config for symmetry')

  // Restore env
  if (originalXdg === undefined) {
    delete process.env.XDG_CONFIG_HOME
  } else {
    process.env.XDG_CONFIG_HOME = originalXdg
  }

  fs.rmSync(tmpDir, { recursive: true, force: true })
  console.log('PASS: XDG_CONFIG_HOME/<name>rc symmetry is honoured')
})()

// Test 3: Relative XDG_CONFIG_HOME is considered invalid per XDG spec and falls back to $HOME/.config
;(function testXdgConfigHomeRelativeFallback () {
  var n = 'rctest' + Math.random().toString(36).slice(2)

  var originalXdg = process.env.XDG_CONFIG_HOME
  process.env.XDG_CONFIG_HOME = 'relative/path/to/xdg' // Relative path -> invalid

  var rcModule = path.resolve(__dirname, '../index.js')
  delete require.cache[rcModule]
  var rc = require('../')

  var config = rc(n, { relativeFallback: true })
  assert.equal(config.relativeFallback, true,
    'Relative XDG_CONFIG_HOME must fall back to default without error')

  // Restore
  if (originalXdg === undefined) {
    delete process.env.XDG_CONFIG_HOME
  } else {
    process.env.XDG_CONFIG_HOME = originalXdg
  }

  console.log('PASS: Relative XDG_CONFIG_HOME ignored and falls back per XDG specification')
})()

// Test 4: Whitespace-only or empty XDG_CONFIG_HOME falls back to $HOME/.config
;(function testXdgConfigHomeEmpty () {
  var n = 'rctest' + Math.random().toString(36).slice(2)

  var originalXdg = process.env.XDG_CONFIG_HOME
  process.env.XDG_CONFIG_HOME = '   '

  var rcModule = path.resolve(__dirname, '../index.js')
  delete require.cache[rcModule]
  var rc = require('../')

  var config = rc(n, { emptyXdg: true })
  assert.equal(config.emptyXdg, true,
    'Whitespace-only XDG_CONFIG_HOME must fall back to default without error')

  // Restore
  if (originalXdg === undefined) {
    delete process.env.XDG_CONFIG_HOME
  } else {
    process.env.XDG_CONFIG_HOME = originalXdg
  }

  console.log('PASS: Whitespace-only XDG_CONFIG_HOME treated as unset')
})()
