var cc   = require('./lib/utils')
var path = require('path')
var join = path.join
var isAbsolute = path.isAbsolute || function (p) { return p.charAt(0) === '/' || /^[a-zA-Z]:[/\\]/.test(p); }
var deepExtend = require('deep-extend')
var etc = '/etc'
var win = process.platform === "win32"
var home = win
           ? process.env.USERPROFILE
           : process.env.HOME

module.exports = function (name, defaults, argv, parse) {
  if('string' !== typeof name)
    throw new Error('rc(name): name *must* be string')
  if(!argv)
    argv = require('minimist')(process.argv.slice(2))
  defaults = (
      'string' === typeof defaults
    ? cc.json(defaults) : defaults
    ) || {}

  parse = parse || cc.parse

  var env = cc.env(name + '_')

  var configs = [defaults]
  var configFiles = []
  function addConfigFile (file) {
    if (configFiles.indexOf(file) >= 0) return
    var fileConfig = cc.file(file)
    if (fileConfig) {
      configs.push(parse(fileConfig))
      configFiles.push(file)
    }
  }

  // which files do we look at?
  if (!win)
   [join(etc, name, 'config'),
    join(etc, name + 'rc')].forEach(addConfigFile)

  // Honour the XDG Base Directory Specification:
  // $XDG_CONFIG_HOME defaults to $HOME/.config when unset, empty, or relative.
  var xdgEnv = process.env.XDG_CONFIG_HOME
  var xdgConfigHome = (xdgEnv && xdgEnv.trim() && isAbsolute(xdgEnv.trim()))
    ? xdgEnv.trim()
    : (home ? join(home, '.config') : null)

  if (xdgConfigHome)
   [join(xdgConfigHome, name, 'config'),
    join(xdgConfigHome, name),
    join(xdgConfigHome, name + 'rc')].forEach(addConfigFile)

  if (home)
   [join(home, '.' + name, 'config'),
    join(home, '.' + name + 'rc')].forEach(addConfigFile)

  addConfigFile(cc.find('.'+name+'rc'))
  if (env.config) addConfigFile(env.config)
  if (argv.config) addConfigFile(argv.config)

  return deepExtend.apply(null, configs.concat([
    env,
    argv,
    configFiles.length ? {configs: configFiles, config: configFiles[configFiles.length - 1]} : undefined,
  ]))
}
