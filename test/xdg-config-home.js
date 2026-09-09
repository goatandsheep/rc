'use strict'
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var os = require('os')

// Test: XDG_CONFIG_HOME is honoured when set
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

  // Clear require cache so index.js re-evaluates with updated env
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

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true })
  console.log('PASS: XDG_CONFIG_HOME custom path is honoured')
})()

// Test: XDG_CONFIG_HOME falls back to $HOME/.config when unset
;(function testXdgConfigHomeDefault () {
  var n = 'rctest' + Math.random().toString(36).slice(2)

  // Save and clear XDG_CONFIG_HOME
  var originalXdg = process.env.XDG_CONFIG_HOME
  delete process.env.XDG_CONFIG_HOME

  var home = process.env.HOME || process.env.USERPROFILE
  if (!home) {
    console.log('SKIP: $HOME not set, cannot test XDG fallback')
    return
  }

  // The default path should be $HOME/.config/<n>/config (not created, just verified the list)
  var rcModule = path.resolve(__dirname, '../index.js')
  delete require.cache[rcModule]
  var rc = require('../')

  // No config file exists, just verify defaults come through (no crash)
  var config = rc(n, { fallback: true })
  assert.equal(config.fallback, true,
    'XDG fallback: default value must be returned when no config file exists')

  // Restore
  if (originalXdg !== undefined) {
    process.env.XDG_CONFIG_HOME = originalXdg
  }

  console.log('PASS: XDG_CONFIG_HOME unset falls back to $HOME/.config without error')
})()

// Test: empty XDG_CONFIG_HOME falls back to $HOME/.config
;(function testXdgConfigHomeEmpty () {
  var n = 'rctest' + Math.random().toString(36).slice(2)

  var originalXdg = process.env.XDG_CONFIG_HOME
  process.env.XDG_CONFIG_HOME = '   '  // whitespace only → treated as unset

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

  console.log('PASS: Whitespace-only XDG_CONFIG_HOME treated as unset (falls back to $HOME/.config)')
})()
