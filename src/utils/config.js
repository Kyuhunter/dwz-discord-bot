// Entry point: re-export ConfigManager and bind its methods for default instance
const ConfigManager = require('./config/index');
const configManager = new ConfigManager();

// Bind methods for default instance convenience
Object.getOwnPropertyNames(ConfigManager.prototype)
  .filter(name => name !== 'constructor')
  .forEach(name => {
    ConfigManager[name] = configManager[name].bind(configManager);
  });

module.exports = ConfigManager;
