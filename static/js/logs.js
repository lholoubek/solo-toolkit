const events = require('events').EventEmitter;
const fs = require('fs');
const process = require('process');
const async = require('async');
const _ = require('underscore');

class LogPuller extends EventEmitter{
  constructor(options, progressCallback) {
    super();
    console.log("Created new logpuller");
    this.isCancelled = false;
    this.options = {};
    var lp = this;
  }
  set_log_options(options){
    this.options = options;
  }
  start_log_pull(){
    //This method does a few things:
    // - Emits event to notify UI that log pulling has started
    // - Calls pull_logs for Solo and/or controller, depending on selected option

    console.log("Collecting logs!");
    console.log("Options in start_log_pull() - " + this.options);
    console.log('emitting start-pull');
    this.emit('start-pull');  //notify UI that the log pull has started

    if (lp.options.controller_logs && !lp.isCancelled){ //if the user wants controller logs, call pull_logs() with controller connection
      console.log("Calling pull_logs() for controller");
      lp.pull_logs(solo.controller_connection);
    }

    if (lp.options.solo_logs && !lp.isCancelled){ //if the user wants Solo logs, call pull_logs() with solo connection
      console.log("Calling pull_logs() for solo");
      lp.pull_logs(solo.solo_connection);
    }
  };

  pull_logs(connection){
    //Takes an sftp connection and pulls logs for that device
    connection.sftp(function(err, sftp){
      console.log("Trying to connect to pull logs");
      if (err) {
        lp.cancel();
        throw err;
      }
      sftp.readdir('/log', (err, list)=>{
        if (err) {
          lp.cancel();
          throw err;
        }

        console.log("Pre filtered list: " + list.toString());
        var filtered_list = _.filter(list, lp.file_list_filter);
        var count = 0;
        var length = filtered_list.length;

        async.whilst(
          count < length && !lp.isCancelled, //if we haven't pulled all the files yet and
          function(callback){
            count++;
            //Pull the next file from the filter_list and sftp it over
            sftp.fastGet("/log/" + filtered_list[count].filename, process.env.HOME + lp.options.output_path, (err)=>{
              if (err) {
                console.log("Something blew up transferring files");
                callback(err);
              } else{
                updateLogsProgress(int(count/length)); //update the progress bar on the way through
              }
            });
          },
          function(){
            console.log("logpull complete");
            lp.cancel();
        });
      });
    });
  }
  cancel(){
    //Cancels any current logpull operation
    console.log("LogPuller.cancel()");
    updateLogsProgress(0);
    this.emit('cancelled');
    this.isCancelled = true;
  };

  file_list_filter(filename){
    //Helper method that takes a list of all files in the /log dir on Solo or Artoo and returns array of filenames based on user selected options
    //General algo here -
    // If it's a directory (which we know if '.' is not in the filename), return false.
    // If we want all logs, return anything with a number in it
    // If we don't want all logs, parse out the int at the end of the file and
    var name = filename.filename;

    if (name.includes('.')){
      //We have a filename.
      if (lp.collect_all_logs){
        return true;
      } else {
        var max_lognum = lp.options.num_logs;
        //TODO - IMPLEMENT PARSER TO EXTRACT LOGNAMES AND RETURN ONLY IF < max_lognum
        return true;
      }
    } else {
      return false;
    }
  }
};

var logPuller = new LogPuller(updateLogsProgress);

logPuller.on('start-pull', ()=>{
  //Listen for 'start-pull' even from LogPuller and swap button
  //When the log puller work begins, swap the button to cancel and attach an event handler
  console.log("received start-pull");
  //$('#collect-logs-button').html('Cancel');
  $('#collect-logs-button').unbind('click');
  $('#collect-logs-button').html("cancel");
  $('#collect-logs-button').bind('click', ()=>{
    logPuller.cancel()
  });
});

logPuller.on('cancelled', ()=>{
  $('#collect-logs-button').unbind('click');
  $('#collect-logs-button').html('Collect logs');
  $('#collect-logs-button').on('click', start_log_pull);
});

//Begin log pulling when the button is clicked
$('#collect-logs-button').on('click', start_log_pull);
function start_log_pull(){
  //First get the settings to determine what logs we need to get from where
  var logs_options = build_logs_options();

  //DEBUGGING only - DELETE THIS WHEN NOT DEBUGGING
  //solo.soloConnected = true;
  //_____________________

  //Check to see if we have SSH connections to use for pulling logs
  var haveConnections = checkConnections(logs_options);
  if (!haveConnections){
    if (!logs_options.solo_logs && !logs_options.controller_logs){
      display_overlay("Select controller or Solo",
      "You haven't selected a device to pull logs from. ");
    } else {
      display_overlay("Check connections", "You're not connected to the device to pull logs from.");
    }
  } else {
    logPuller.set_log_options(logs_options);
    process.nextTick(()=>{
      logPuller.start_log_pull() //Should pull from devices specified in
    });

    return
  }
};

//Set up our output path directory chooser
$('#open-file-button').on('click', function(){
  console.log("pressed #open-file-button");
  // mui.overlay('on', overlay_options);
  var output_path_element = $('#location-chooser-text');
  getDirectory(output_path_element);
});

function build_logs_options(){
  //Creates logs_options object, parses the DOM, and fills out corresponding fields in the object, then returns it
  var logs_options = {
    output_path:"",
    solo_logs:false,
    controller_logs:false,
    collect_all_logs:false,
    num_logs:0,
    create_zip:false,
    flight_notes:""
  };
  //Get the output path
  var path = $('#location-chooser-text').val();
  //TODO - Make this work across systems and pull a default path from a user default
  path.length < 1 ? logs_options.output_path = "~/Desktop" : logs_options.output_path = path

  //Check if the user wants to collect Solo logs
  if ($('#solo-logs-option').prop('checked')){
    logs_options.solo_logs = true;
  }
  //Check if the user wants to collect controller logs
  if ($('#controller-log-option').prop('checked')){
    logs_options.controller_logs = true;
  }
  //Check how many logs the user wants collected
  var num = $('#num-logs-select option:selected').text();
  num.toLowerCase() === "all" ? logs_options.collect_all_logs = true : logs_options.num_logs = parseInt(num);

  //check whether we need to create a zipfile
  if ($('#zipfile-log-option').prop('checked')){
    logs_options.create_zip = true;
  }
  //Parse the flight notes
  var notes = $('#flight-notes').val();
  logs_options.flight_notes = notes;

  return logs_options;
}

function checkConnections(options){
  //Takes a log options and confirms we have a connection to the devices necessary to pull logs
  //If no device selected or no connection, displays error to user
  if (options.solo_logs && options.controller_logs) {
    //we want logs from both
    return solo.controllerConnected && solo.soloConnected ? true : false;
  } else if (options.solo_logs) {
    //we want just solo logs
    return solo.soloConnected ? true : false;
  } else if (options.controller_logs){
    //we want just controller logs
    return solo.controllerConnected ? true :  false;
  } else {
    return false;
  }
}

function updateLogsProgress(newVal){
  //Updates progress bar to reflect newVal
  var logs_progress_bar = $('#logs-progress-bar');
  newVal > 100 ? logs_progress_bar.width(100) : logs_progress_bar.width(newVal);
}
