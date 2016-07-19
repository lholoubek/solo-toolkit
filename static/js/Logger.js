// Set up logger
const DevToolsTransport = require('./app/js/DevToolsTransport');
const process = require('process');
const Winston = require('winston');
const LogfileHelpers = require('./app/js/LogfileHelpers');
const fs = require('fs');
const remote = require('electron').remote;

const Logger = Winston;

// If the app is packaged, add a file transport and remove the console transport
// if (remote.getGlobal('env').packaged){
if (true){
  let logname = "solo-toolkit.log." + LogfileHelpers.generate_date_string();
  if (process.platform == "darwin") {
    // We're on macOS. Drop the logfile in ~/Library/Logs/SoloToolkit
    let log_path = process.env.HOME + "/Library/Logs/SoloToolkit/"
    if (!fs.existsSync(log_path)){
      fs.mkdirSync(log_path);
    }
    logname = log_path + logname;
    Logger.add(Winston.transports.File, {filename: logname});
  } else{
    // TODO - cross-platform logging
  }

}
// If the app is being developed, add a dev tools transport.
if (remote.getGlobal('env').dev){
  Logger.add(DevToolsTransport);
  Logger.remove(Winston.transports.Console);
  Logger.info('This is a test')
}
Logger.info("Started Solo Toolkit");
