'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var events = require('events').EventEmitter;
var fs = require('fs');
var process = require('process');
var async = require('async');

var LogPuller = function (_EventEmitter) {
  _inherits(LogPuller, _EventEmitter);

  function LogPuller(options, progressCallback) {
    _classCallCheck(this, LogPuller);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(LogPuller).call(this));

    console.log("Created new logpuller");
    _this.isCancelled = false;
    _this.options = {};
    var lp = _this;
    return _this;
  }

  _createClass(LogPuller, [{
    key: 'set_log_options',
    value: function set_log_options(options) {
      this.options = options;
    }
  }, {
    key: 'start_log_pull',
    value: function start_log_pull() {
      //This method does a few things:
      // - Emits event to notify UI that log pulling has started
      // - Calls pull_logs for Solo and/or controller, depending on selected option

      console.log("Collecting logs!");
      console.log("Options in start_log_pull() - " + this.options);
      console.log('emitting start-pull');
      this.emit('start-pull'); //notify UI that the log pull has started

      if (lp.options.controller_logs && !lp.isCancelled) {
        //if the user wants controller logs, call pull_logs() with controller connection
        console.log("Calling pull_logs() for controller");
        lp.pull_logs(solo.controller_connection);
      }

      if (lp.options.solo_logs && !lp.isCancelled) {
        //if the user wants Solo logs, call pull_logs() with solo connection
        console.log("Calling pull_logs() for Solo");
        lp.pull_logs(solo.solo_connection);
      }
    }
  }, {
    key: 'pull_logs',
    value: function pull_logs(connection) {
      //Takes an sftp connection and pulls logs for that device
      connection.sftp(function (err, sftp) {
        console.log("Trying to connect to pull logs");
        if (err) {
          lp.cancel();
          throw err;
        }
        sftp.readdir('/log', function (err, list) {
          if (err) throw err;

          //TODO:
          //Take list and filter using helper function below based on user's selected options
          //use async.whilst() to rip through the list and download all files, while checking to make sure job hasn't been cancelled
        });

        //TEST CODE TO PULL A FILE
        // sftp.fastGet("/VERSION",process.env.HOME + "/Desktop/VERSION", (err)=>{
        //   if (err) {
        //     throw err;
        //     console.log("Something blew up transferring files");
        //   }
        // })
      });
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      //Cancels any current logpull operation
      console.log("LogPuller.cancel()");
      this.emit('cancelled');
      this.isCancelled = true;
    }
  }, {
    key: 'filter_log_list',
    value: function filter_log_list(item) {
      //Helper method that takes a list of all files in the /log dir on Solo or Artoo and returns array of filenames based on user selected options

    }
  }]);

  return LogPuller;
}(EventEmitter);

;

var logPuller = new LogPuller(updateLogsProgress);

logPuller.on('start-pull', function () {
  //Listen for 'start-pull' even from LogPuller and swap button
  //When the log puller work begins, swap the button to cancel and attach an event handler
  console.log("received start-pull");
  //$('#collect-logs-button').html('Cancel');
  $('#collect-logs-button').unbind('click');
  $('#collect-logs-button').html("cancel");
  $('#collect-logs-button').bind('click', function () {
    logPuller.cancel();
  });
});

logPuller.on('cancelled', function () {
  $('#collect-logs-button').unbind('click');
  $('#collect-logs-button').html('Collect logs');
  $('#collect-logs-button').on('click', start_log_pull);
});

//Begin log pulling when the button is clicked
$('#collect-logs-button').on('click', start_log_pull);
function start_log_pull() {
  //First get the settings to determine what logs we need to get from where
  var logs_options = build_logs_options();

  //DEBUGGING only - DELETE THIS WHEN NOT DEBUGGING
  //solo.soloConnected = true;
  //_____________________

  //Check to see if we have SSH connections to use for pulling logs
  var haveConnections = checkConnections(logs_options);
  if (!haveConnections) {
    if (!logs_options.solo_logs && !logs_options.controller_logs) {
      display_overlay("Select controller or Solo", "You haven't selected a device to pull logs from. ");
    } else {
      display_overlay("Check connections", "You're not connected to the device to pull logs from.");
    }
  } else {
    logPuller.set_log_options(logs_options);
    process.nextTick(function () {
      logPuller.start_log_pull(); //Should pull from devices specified in
    });

    return;
  }
};

//Set up our output path directory chooser
$('#open-file-button').on('click', function () {
  console.log("pressed #open-file-button");
  // mui.overlay('on', overlay_options);
  var output_path_element = $('#location-chooser-text');
  getDirectory(output_path_element);
});

function build_logs_options() {
  //Creates logs_options object, parses the DOM, and fills out corresponding fields in the object, then returns it
  var logs_options = {
    output_path: "",
    solo_logs: false,
    controller_logs: false,
    collect_all_logs: false,
    num_logs: 0,
    create_zip: false,
    flight_notes: ""
  };
  //Get the output path
  var path = $('#location-chooser-text').val();
  //TODO - Make this work across systems and pull a default path from a user default
  path.length < 1 ? logs_options.output_path = "~/Desktop" : logs_options.output_path = path;

  //Check if the user wants to collect Solo logs
  if ($('#solo-logs-option').prop('checked')) {
    logs_options.solo_logs = true;
  }
  //Check if the user wants to collect controller logs
  if ($('#controller-log-option').prop('checked')) {
    logs_options.controller_logs = true;
  }
  //Check how many logs the user wants collected
  var num = $('#num-logs-select option:selected').text();
  num.toLowerCase() === "all" ? logs_options.collect_all_logs = true : logs_options.num_logs = parseInt(num);

  //check whether we need to create a zipfile
  if ($('#zipfile-log-option').prop('checked')) {
    logs_options.create_zip = true;
  }
  //Parse the flight notes
  var notes = $('#flight-notes').val();
  logs_options.flight_notes = notes;

  return logs_options;
}

function checkConnections(options) {
  //Takes a log options and confirms we have a connection to the devices necessary to pull logs
  //If no device selected or no connection, displays error to user
  if (options.solo_logs && options.controller_logs) {
    //we want logs from both
    return solo.controllerConnected && solo.soloConnected ? true : false;
  } else if (options.solo_logs) {
    //we want just solo logs
    return solo.soloConnected ? true : false;
  } else if (options.controller_logs) {
    //we want just controller logs
    return solo.controllerConnected ? true : false;
  } else {
    return false;
  }
}

function updateLogsProgress(newVal) {
  //Updates progress bar to reflect newVal
  var logs_progress_bar = $('#logs-progress-bar');
  newVal > 100 ? logs_progress_bar.width(100) : logs_progress_bar.width(newVal);
}