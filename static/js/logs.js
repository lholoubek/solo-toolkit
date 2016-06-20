const events = require('events').EventEmitter;
const fs = require('fs');
const process = require('process');
const async = require('async');
const _ = require('underscore');

const LogPuller = require('./build/js/LogPuller');

//removed class from here into separate module
var logPuller = new LogPuller();
logPuller.set_progress_callback(updateLogsProgress); //pass this the status bar update callback`

logPuller.on('start-pull', ()=>{
  //Listen for 'start-pull' event from LogPuller and swap button
  //When the log puller work begins, swap the button to cancel and attach an event handler for cancellation
  //Also disable the interface so users can't change options while logs are being pulled
  console.log("received start-pull");
  $('#collect-logs-button').unbind('click');
  $('#collect-logs-button').html("cancel");
  logs_options_enabled(false);
  process.nextTick(()=>{$('#collect-logs-button').bind('click', ()=>{
      logPuller.cancel()
    });
  });
});

logPuller.on('cancelled', ()=>{
  $('#collect-logs-button').unbind('click');
  $('#collect-logs-button').html('Collect logs');
  $('#collect-logs-button').on('click', start_log_pull);
  //Re-enabled logs options
  logs_options_enabled(true);
  console.log("cancelled event concluded");
});

//Begin log pulling when the button is clicked
$('#collect-logs-button').on('click', start_log_pull);
function start_log_pull(){
  //First get the settings to determine what logs we need to get from where
  var logs_options = build_logs_options();

  //Make sure cancelled is false - user just started this (not cancelled yet)
  logPuller.isCancelled = false;

  //Check to see if we have SSH connections to use for pulling logs
  var haveConnections = checkConnections(logs_options);
  if (!haveConnections){
    if (!logs_options.solo_logs && !logs_options.controller_logs){
      display_overlay("error","Select controller or Solo",
      "You haven't selected a device to pull logs from. ");
    } else {
      display_overlay("error","Check connections", "You're not connected to the device to pull logs from.");
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
$('#open-logs-dir').on('click', function(){
  console.log("pressed #open-logs-dir");
  var output_path_element = $('#logs-location-text');
  getDirectory(output_path_element);
});

function build_logs_options(){
  //@return {object} logs_options – logs options selected by the user, parsed from the DOM
  //Creates logs_options object, parses the DOM, and fills out corresponding fields in the object, then returns it
  var logs_options = {
    output_path:"",
    log_folder_name: "",
    solo_logs:false,
    controller_logs:false,
    collect_all_logs:false,
    num_logs:0,
    create_zip:false,
    flight_notes:""
  };

  //Get the output path
  var path = $('#logs-location-text').val();
  //TODO - Make this work across systems and pull a default path from a user default
  path.length < 1 ? logs_options.output_path = process.env.HOME + "/Desktop" : logs_options.output_path = path;

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
  console.log("Flight notes: ", notes);

  logs_options.flight_notes = notes;

  //Create the name for the log folder using today's date
  var date = new Date();
  logs_options.log_folder_name =logs_options.output_path +"/" + date.getFullYear() + "_" + (date.getMonth() + 1).toString() + "_" + date.getDate() + "_logs";

  return logs_options;
}

function checkConnections(options){
  //Takes a log options object and confirms we have a connection to the devices necessary to pull logs
  //@param {object} options log options object
  //@returns {bool}
  //If no device selected or no connection, displays error to user
  if (options.solo_logs && options.controller_logs) { //we want logs from both controller and solo
    return solo.controllerConnected && solo.soloConnected ? true : false;
  } else if (options.solo_logs) { //we want just solo logs
    return solo.soloConnected ? true : false;
  } else if (options.controller_logs){  //we want just controller logs
    return solo.controllerConnected ? true :  false;
  } else {
    return false;
  }
}

function logs_options_enabled(enabled){
  //@param {bool} enabled - specify whether the interface should be enabled or disabled
  $('.option-heading').find('form').prop("disabled", !enabled);
  $('.option-heading').find('input').prop('disabled', !enabled);
  $('.option-heading').find('select').prop('disabled', !enabled);
  $('.option-heading').find('option').prop('disabled', !enabled);
  $('.option-heading').find('button').prop('disabled', !enabled);
  $('.option-heading').find('textarea').prop('disabled', !enabled);

  //Make sure we keep the cancel button always enabled
  $('#collect-logs-button').prop('disabled', false);
};

function updateLogsProgress(newVal){
  //Updates progress bar to reflect newVal
  console.log("updating progress bar. New val: " + newVal);
  var logs_progress_bar = $('#logs-progress-bar');
  newVal > 100 ? logs_progress_bar.width(100) : logs_progress_bar.width(newVal + "%");
}
