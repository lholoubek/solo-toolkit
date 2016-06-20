'use strict';

var readline = require('readline');
var sh = require('./build/js/SettingsHelpers');

$('#open-firmware-dir').click(function () {
  console.log("Opening firmware location choose");
  setTimeout(function () {
    var output_path_element = $('#firmware-location');
    getDirectory(output_path_element);
  }, 300);
});

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

$('#update-firmware-button').click(function () {
  //First determine which devices the user wants to update by grabbing value from the select form
  var option = $('#firmware-devices-select option:selected').text().toLowerCase().trim();
  var update_devices = { solo: {}, controller: {}, path: '' };

  //DEBUGGING
  solo.controllerConnected = true;

  switch (option) {
    //Determine which devices are being updated by reviewing the user-selected option

    case "controller and solo":
      console.log("updating both");
      if (!solo.controllerConnected) {
        display_overlay('settings', "Not connected", "Not connected to controller. Connect to controller and Solo to update firmware.");
        return;
      } else if (!solo.soloConnected) {
        display_overlay('settings', "Not connected", "Not connected to Solo. Connect to solo to update Solo firmware.");
        return;
      } else {
        update_devices.solo.update = true;
        update_devices.controller.update = true;
      }
      break;
    case "solo only":
      console.log("updating solo only");
      if (!solo.soloConnected) {
        display_overlay('settings', "Not connected", "Not connected to controller. Connect to controller and Solo to update Solo firmware.");
        return;
      } else {
        update_devices.solo.update = true;
        update_devices.controller.update = false;
      }
      break;
    case "controller only":
      console.log("updating controller only");
      if (!solo.controllerConnected) {
        display_overlay('settings', "Not connected", "Not connected to controller. Connect to controller to update controller firmware.");
        return;
      } else {
        update_devices.solo.update = false;
        update_devices.controller.update = true;
      }
      break;
  }

  update_devices.path = $('#firmware-location').val();
  console.log(update_devices.path.length);
  console.log("Firmware path: ", update_devices.path);
  sh.check_firmware_path(update_devices, function (invalid_path_message) {
    display_overlay("error", "Firmware update error", invalid_path_message);
    return;
  }, function () {
    //called when path is valid and firmware is present

  });
});

// var reboot = function(event, arg){ //this gets called from the main process; needs to handle an event and an argument
//   console.log(arg);
// };

function param_reset() {
  console.log("param_reset called");
};