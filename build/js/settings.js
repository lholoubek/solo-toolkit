'use strict';

var readline = require('readline');

//reboot button
$('#reboot-button').click(function () {
  console.log("reboot button clicked!");
});
//Param reset
$('#param-reset-button').click(function () {});

//Accel calibration
$('#accel-calibration-button').click(function () {
  accel_calibration();
});

//Accel calibration
$('#accel-calibration-button').click(function () {
  accel_calibration();
});

$('#stick-calibration-button').click(function () {
  console.log("stick_cal called");
  //DEBUGGING
  if (true) {
    (function () {
      //if (solo.controllerConnected){
      var modal_options = {
        cancel_button: true,
        button_text: "begin"
      };
      display_overlay('settings', "Start stick calibration", 'Select "BEGIN" to start stick calibration.', modal_options);
      var cancel_button = $("#optional-button");
      var confirm_button = $('#modal-button');
      cancel_button.click(function () {
        clear_overlay();
      });
      confirm_button.click(function () {
        modal_options = {
          cancel_button: false,
          confirm_button: false
        };
        display_overlay('settings', "Initiating stick calibration...", "Starting stick calibration, please wait...", modal_options);
        setTimeout(1500, calibrate_sticks());
      });
    })();
  } else {
    display_overlay("error", "Not connected to controller", "You must connect to your controller before calibrating. Check your wifi connection.");
  }
});

var reboot = function reboot(event, arg) {
  //this gets called from the main process; needs to handle an event and an argument
  console.log(arg);
};

function param_reset() {
  console.log("param_reset called");
};

function accel_calibration() {
  console.log("accel_calibration called");
};

function factory_reset() {
  console.log("factory_reset()");
  solo.controller_connection.exec("sololink_config --factory-reset", function (err, stream) {
    stream.on('data', function (data) {
      console.log("received data...");
    });
  });
}

function calibrate_sticks() {
  console.log("calibrate_sticks()");
  solo.controller_connection.shell(function (err, stream) {
    console.log("Connecting to stick cal");
    if (err) {
      display_overlay("error", "Calibration error", "An error occurred while running stick cal.");
    }
    stream.setEncoding('utf8');
    stream.once("data", function (data) {
      console.log("Received data");
      stream.write("runStickCal.sh\n");
      var default_timeout = setTimeout(function () {
        console.log("stick cal ran for 20s. Killing connection.");
        solo.controller_connection.end();
      }, 20000);
      var modal_options = { image: "<img src='./build/assets/img/stick_cal.gif' class='settings-image' alt='stick calibration'>" };
      display_overlay("settings", "Stick Calibration", "Calibrate your sticks by moving all sticks to every position.", modal_options);
      $('#modal-button').off('click');
      $('#modal-button').on('click', function () {
        console.log("user ended calibration");
        stream.write("\x03");
      });
    });
    stream.on('data', function (data) {
      console.log(data.toString());
    });
  });
  console.log("exec call returned");
};

function factory_reset() {
  //Executes a factory reset on

  console.log("factory_reset()");
};