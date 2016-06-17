'use strict';

var readline = require('readline');
var sh = require('./build/js/SettingsHelpers');

$('#stick-calibration-button').click(function () {
  console.log("stick_cal called");
  //DEBUGGING
  if (solo.controllerConnected) {
    (function () {
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
        setTimeout(1500, sh.calibrate_sticks(solo.controller_connection));
      });
    })();
  } else {
    display_overlay("error", "Not connected to controller", "You must connect to your controller before calibrating. Check your wifi connection.");
  }
});

$('#factory-reset-button').click(function () {
  sh.reset_check_confirm("factory");
});

$('#settings-reset-button').click(function () {
  sh.reset_check_confirm('settings');
});

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

// var reboot = function(event, arg){ //this gets called from the main process; needs to handle an event and an argument
//   console.log(arg);
// };

function param_reset() {
  console.log("param_reset called");
};