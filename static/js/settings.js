const readline = require('readline');
const sh = require('./build/js/SettingsHelpers');
const Updater = require("./build/js/Updater");

$('#open-firmware-dir').click(()=>{
  console.log("Opening firmware location choose");
  setTimeout(()=>{
    var output_path_element = $('#firmware-location');
    getDirectory(output_path_element);
  }, 300);
});

$('#stick-calibration-button').click(()=>{
  console.log("stick_cal called");
  if (solo.controllerConnected){
    let modal_options = {
      cancel_button: true,
      button_text: "begin"
    }
    display_overlay('settings', "Start stick calibration", 'Select "BEGIN" to start stick calibration.', modal_options);
    let cancel_button = $("#optional-button");
    let confirm_button = $('#modal-button');
    cancel_button.click(()=>{
      clear_overlay();
    });
    confirm_button.click(()=>{
      modal_options = {
        cancel_button: false,
        confirm_button: false
      }
      display_overlay('settings', "Initiating stick calibration...", "Starting stick calibration, please wait...", modal_options);
      setTimeout(1500, sh.calibrate_sticks(solo.controller_connection));
    });
  } else {
    display_overlay("connection", "Not connected to controller", "You must connect to your controller before calibrating. Check your wifi connection.");
  }
});

$('#factory-reset-button').click(()=>{
  sh.reset_check_confirm("factory");
 });

 $('#settings-reset-button').click(()=>{
   sh.reset_check_confirm('settings');
 });

//reboot button
$('#reboot-button').click(() => {
  console.log("reboot button clicked!");
});
//Param reset
$('#param-reset-button').click(() => {

});

$('#update-firmware-button').click(()=>{
  //First determine which devices the user wants to update by grabbing value from the select form
  var option = $('#firmware-devices-select option:selected').text().toLowerCase().trim();
  var update_devices = {solo:{}, controller:{}, path:''};

  //DEBUGGING!!!!!!!!
  // solo.controllerConnected = true;
 // DEBUGGING!!!!

  switch (option){
    //Determine which devices are being updated by reviewing the user-selected option
    case "controller and solo":
      console.log("updating both");
      if (!solo.controllerConnected){
        display_overlay('connection', "Not connected", "Not connected to controller. Connect to controller and Solo to update firmware.")
        return;
      } else if (!solo.soloConnected){
        display_overlay('connection', "Not connected", "Not connected to Solo. Connect to solo to update Solo firmware.")
        return;
      } else {
        update_devices.solo.update = true;
        update_devices.controller.update = true;
        update_devices.solo.connection = solo.solo_connection;
        update_devices.controller.connection = solo.controller_connection;
        var SoloUpdater = new Updater('solo');
        sh.create_updater_handlers(SoloUpdater, update_settings_progress, update_error_message);
        var ControllerUpdater = new Updater('controller');
        sh.create_updater_handlers(ControllerUpdater, update_settings_progress, update_error_message);
        SoloUpdater.set_next(ControllerUpdater.update());  // We want to update both devices so we need to give SoloUpdater a next callback
        var first_updater = SoloUpdater;
      }
      break;
    case "solo only":
      console.log("updating solo only");
      if (!solo.soloConnected){
        display_overlay('connection', "Not connected", "Not connected to controller. Connect to controller and Solo to update Solo firmware.")
        return;
      } else {
        update_devices.solo.update = true;
        update_devices.solo.connection = solo.solo_connection;
        update_devices.controller.update = false;
        var SoloUpdater = new Updater('solo');
        sh.create_updater_handlers(SoloUpdater, update_settings_progress, update_error_message);
        var first_updater = SoloUpdater;
      }
      break;
    case "controller only":
      console.log("updating controller only");
      if (!solo.controllerConnected){
        display_overlay('connection', "Not connected", "Not connected to controller. Connect to controller to update controller firmware.")
        return;
      } else {
        update_devices.solo.update = false;
        update_devices.controller.update = true;
        update_devices.controller.connection = solo.controller_connection;
        var ControllerUpdater = new Updater('controller');
        sh.create_updater_handlers(ControllerUpdater, update_settings_progress, update_error_message, update_complete);
        var first_updater = ControllerUpdater;
      }
      break;
  }

  update_devices.path = $('#firmware-location').val(); // get the user-selected firmware folder from the form
  console.log(update_devices.path.length);
  console.log("Firmware path: ", update_devices.path);
  sh.check_firmware_path(update_devices, (invalid_path_message)=>{
    update_error_message(invalid_path_message);
    return;
  },(update_devices)=>{
    //called when path is valid and firmware is present. Passed new update_devices object
    if(update_devices.solo.update) {
      SoloUpdater.set_device(update_devices.solo);
      SoloUpdater.set_local_path(update_devices.path);
    }
    if(update_devices.controller.update) {
      ControllerUpdater.set_device(update_devices.controller);
      ControllerUpdater.set_local_path(update_devices.path);
    }
    first_updater.update();
  });
});

function update_error_message(message){
  display_overlay("error","Firmware update error", message)
};

function update_complete(){
  display_overlay('')
}

function param_reset(){
  console.log("param_reset called");
};

function update_settings_progress(newVal, message){
  // console.log("update_settings_progress", newVal, message);
  //Updates progress bar to newVal, displays message immediately below progress bar
  var settings_progress_bar = $('#settings-progress-bar');
  newVal > 100 ? settings_progress_bar.width(100) : settings_progress_bar.width(newVal + "%");
  if(message){
    $('#settings-progress-message').html(message);
  } else $('#settings-progress-message').html('');
};
