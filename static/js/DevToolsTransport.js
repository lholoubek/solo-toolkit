// Implements a transport for Winston enabling logging to the Chrome dev tools in electron
// This transport is intended to be enabled for debugging Only

const Winston = require('winston');
const os = require('os');

class DevToolsTransport extends Winston.Transport{
  constructor(options){
    super();

    this.options = options == undefined ? {} : options;
    this.showLevel = this.options.showLevel === undefined ? true : options.showLevel;

    // Add a name as required by Winston
    this.name = "DevToolsTransport";

  }
  log(level, msg, meta, callback){
    let output = level + ": " + msg;
    console.log(output);
    callback(null, true);
  }
}

// Export the class
 module.exports = DevToolsTransport;
