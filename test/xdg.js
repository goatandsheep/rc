var assert = require('assert')
var fs = require('fs')
var path = require('path')
var os = require('os')

var appName = 'rctest' + Math.floor(Math.random() * 100000)
var tmpDir = path.join(os.tmpdir(), 'xdg-test-' + appName)
var configDir = path.join(tmpDir, appName)

fs.mkdirSync(configDir, { recursive: true })

var configFile = path.join(configDir, 'config')
fs.writeFileSync(configFile, JSON.stringify({
  xdgOption: 'loaded-from-xdg',
  number: 123
}))

// Test 1: XDG_CONFIG_HOME is respected
process.env.XDG_CONFIG_HOME = tmpDir

var rc = require('../')
var config = rc(appName, {
  defaultOption: 'default'
})

assert.equal(config.defaultOption, 'default')
assert.equal(config.xdgOption, 'loaded-from-xdg')
assert.equal(config.number, 123)
assert.equal(config.config, configFile)

// Clean up
delete process.env.XDG_CONFIG_HOME
fs.rmSync(tmpDir, { recursive: true, force: true })

console.log('✓ XDG_CONFIG_HOME test passed successfully!')
