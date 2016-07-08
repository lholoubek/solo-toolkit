const _ = require('Underscore');

function calibrate_sticks(connection){
  console.log("calibrate_sticks()");
  connection.shell(function(err, stream){
    console.log("Connecting to stick cal");
    if(err){
      display_overlay("error", "Calibration error", "An error occurred while running stick cal.");
    }
    stream.setEncoding('utf8');
    stream.once("data", function(data){
      console.log("Received data");
      stream.write("runStickCal.sh\n");
      let default_timeout = setTimeout(()=>{
        console.log("stick cal ran for 20s. Killing connection.");
        stream.write("\x03");
        stream.end();
        clear_overlay();
      }, 30000);
      let modal_options = {image:"<img src='./app/assets/img/stick_cal.gif' class='settings-image' alt='stick calibration'>", button_text:"Complete"};
      display_overlay("settings",
                      "Stick Calibration",
                      "Calibrate your sticks by moving all sticks to every position.",
                      modal_options);
      $('#modal-button').off('click');
      $('#modal-button').on('click', function () {
        console.log("user ended calibration");
        stream.write("\x03");
        stream.end();
        clear_overlay();
        display_overlay('settings', "Stick calibration successful", "Successfully completed stick calibration");
      });
    });
    stream.on('data', (data)=>{
      console.log(data.toString());
    });
  });
  console.log("exec call returned");
};

function reset_check_confirm(reset_type){
  if (solo.controllerConnected){
   let connected_devices = solo.soloConnected ? "controller and Solo" :"controller";
   let reset_message = "Select reset to initiate a " + reset_type+ " reset of " + connected_devices;
   display_overlay('settings', reset_type + " reset", reset_message, {cancel_button: true, button_text:"Reset"});
   let cancel_button = $("#optional-button");
   let confirm_button = $('#modal-button');
   cancel_button.click(()=>{
     clear_overlay();
   });
   confirm_button.click(()=>{
     console.log(reset_type + " reset button clicked");
       let modal_options = {
         cancel_button: false,
         confirm_button: false
       }
       setTimeout(()=>{
         console.log("Calling " + reset_type + " reset in 2s...");
         if(solo.soloConnected){
           reset({controller:solo.controller_connection, solo:solo.solo_connection}, reset_type);
         } else reset({controller:solo.controller_connection}, reset_type);  //factory resetting controller only
       }, 2000);
     display_overlay('settings', "Initiating " + reset_type + " reset", "Starting " + reset_type +" reset of " + connected_devices +", please wait...", modal_options);
   });
  } else {
      display_overlay("error", "Not connected to controller", "You must connect to your controller before resetting.");
    }
};

function reset(device, reset_type){
  //@param {Object} device - key value pair with name and ssh connection. Example: {controller:solo.controller_connection, solo:solo.solo_connection}
  //@param {String} command - string for either factor or settings reset. Example: "--settings-reset" or "--factory-reset"
  //@param
  //requests a factory reset for controller and optionally Solo
  console.log("reset()");
  let command = reset_type.toLowerCase() == 'factory' ? '--factory-reset':'--settings-reset';
  console.log("Command: ", command);
  let modal_options = {
    cancel_button: false,
    confirm_button: false
  }
  if (device.solo){
    console.log("Trying to reset Solo...");
    send_sololink_command('solo', command, device.solo, (device, err, stream)=>{
      if (err){
        display_overlay('error', reset_type + ' reset', reset_type + ' reset on Solo failed.', {cancel_button:false, confirm_button:true});
        return;
      }
      stream.on('exit', (code)=>{
        console.log("solo reset command exit code: " + code);
        if(code == 0){
          console.log("Solo reset successfully");
          device.solo.end();
          factory_reset_notify('solo', command);
        } else display_overlay('error', reset_type +" reset error", "Encountered an error while initiating " + reset_type + " reset.", {cancel_button: false});
      });
    });
  }
  //TODO - IMPLEMENT OPTIONAL FACTORY RESET OF EACH DEVICE INSTEAD OF ALWAYS RESETTING CONTROLLER
  send_sololink_command('controller', command, device.controller, (device_name, err, stream)=>{
      if(err){
        display_overlay('error', reset_type + ' reset', reset_type + ' reset on Controller failed.', {cancel_button:false, confirm_button:true});
        return
      }
      stream.on('exit', (code)=>{
        console.log("solo reset command exit code: " + code);
        if(code == 0 ){
            console.log("Controller reset successfully");
            device.controller.end();
            factory_reset_notify('controller', command);
        } else display_overlay('error', reset_type +" reset error", "Encountered an error while initiating " + reset_type + " reset.", {cancel_button: false});
      });
  });
};

function send_sololink_command(device_name, command, connection, callback){
  //@param {String} device - "solo" or 'controller'
  //@param {Object} ssh connection - ssh session with solo or controller
  //@param {function} callback -  callback function accepting stream and error
  console.log("send_sololink_command - ", device_name, command);
  connection.exec('sololink_config '+ command, (err, stream)=>{
    if (err) {
      console.error("Blew up trying to send command to " + device_name + " " + command);
      callback(device_name, err);
    }
    callback(device_name, err, stream);
  })
}

function factory_reset_notify(device_name, command){
  //called when a factory reset has been initiated successfully on a device
  //@param {String} started - "solo", "controller", "both"
  console.log("factory_reset_notify() ", device_name);

  let reset_type = command == "--factory-reset" ? "Factory" : "Settings";  //sets reset type based on command being issued
  display_overlay('settings',
                  reset_type + ' reset',
                  reset_type + ' reset initiated. Re-connect when controller indicates that factory reset has completed.',
                  {image:"<img src='./app/assets/img/factory_reset_complete.png' class='settings-image' alt='stick calibration'>",
                                                                            cancel_button: false});
}

function check_firmware_path(update_devices, invalid_callback, valid_callback){
  //@param {Object} update_devices - object containing info about the devices to be updated.
  //@param (Function) invalid_callback - called if the path is invalid. Accespts a {String} message to display to the user
  //This could be called for three reasons: 1) no path specified, 2) Specified path doesn't exist, 3) specified path doesn't have firmware files
  //@param {Function} valid_callback - called if path is valid and firmware is valid
  if(update_devices.path.length < 2){  //error out if we weren't given a path
    console.log("no path provided");
    //first failure mode - no path provided
    invalid_callback("Please select a folder containing valid Solo firmware.");
    return;
  };
  fs.readdir(update_devices.path, (err, file_list)=>{
    console.log("reading contents of the firmware directory");
    console.log("File list: ", file_list);
    if (err){
      invalid_callback("Error retrieving files from specified path. Select a different firmware location.");
    }
    if(update_devices.controller.update) {
      update_devices.controller.files = update_file_filter('controller', file_list);
      if (!update_devices.controller.files.tarball || !update_devices.controller.files.md5) {  //Make sure we have the right files for the controller
        invalid_callback("Incorrect update files for controller. Make sure the firmware directory has one .tar.gz file and one md5 file.");
        return;
      }
    }
    if(update_devices.solo.update) {
      update_devices.solo.files = update_file_filter('solo', file_list);
      if (!update_devices.solo.files.tarball || !update_devices.solo.files.md5){ //Make sure we have the right files for Solo
        invalid_callback("Incorrect update files for Solo. Make sure the firmware directory has one .tar.gz file and one md5 file.");
        return;
      }
    }
    //We know the files are there and valid. Call the valid callback with the new update_devices object
    valid_callback(update_devices)
  });
};

function update_file_filter(device, file_list){
  //verifies we have a tarball and returns list of files to update the specified devices, parsed from the full file list in the user-provided directory
  //DOES NOT confirm the versions are the same
  //@param {String} device - 'controller' or 'solo'
  //@param (Array) file_list - list of update firmware, probably from fs.readdir on the firmware path
  //TODO - update this to reject duplicate files. If you have a folder with multiple Solo tarballs, this will return them all
  //Sample list for debugging -
  // let list = ['controller_4.0.0.tar.gz', 'controller_5.5.0.tar.gz.md5', 'controller_3.4.3.tar.gz'];
  let tar_ending = ".gz";
  let md5_ending = "md5";
  let update_files = {};
  let tarball = _.some(file_list, (file)=>{
    if (file.indexOf(device) >= 0 && file.indexOf(tar_ending, file.length - tar_ending.length) > 0){ //true if at least one file in the list includes the device and tar.gz
      if (!update_files.tarball) update_files.tarball = file;  // prevent duplication
      return true;
    } else return false;
  });
  let md5 = _.some(file_list, (file)=>{
    if (file.indexOf(device) >= 0 && file.indexOf(md5_ending, file.length - md5_ending.length) > 0){ // true if at least one file in the list includes device and md5
      if (!update_files.md5) update_files.md5 = file; // prevent duplication if we have multiple files
      return true;
    } else return false;
  });
  return update_files;
}

function create_updater_handlers(updater, progress_updater, error_messager){
  // @param {Object} Updater - instance of the Updater class
  // this function sets up event handlers for various Updater events
  updater.on('transfer-error', ()=>{
    error_messager('Error transferring update files to ' + updater.name);
    progress_updater(0, "Error");
    setTimeout(progress_updater(0, ''), 2000); // Clear the "Error" message after two seconds
  });
  updater.on('update-set-up', ()=>{
    progress_updater(0, 'Device configured');
  });
  updater.on('update-error', (message)=>{
    error_messager("Error initiating update on " + updater.name);
    settings_interface_enabled(true);
  });
  updater.on('update-started', ()=>{
    progress_updater(0, updater.name + " update started.");
    setTimeout(()=>{  // Clear the message after 2 seconds
      progress_updater(0);
    }, 5000);
  });
  updater.on('progress', (newVal, message)=>{
    progress_updater(newVal, message);
  });
  updater.on('error', (error)=>{
    error_messager(error);
  });
}

function version_from_file_list(device, file_list){
  //returns version parsed from file list
  ///@param {String} device - "controller" or "solo"

}

exports.calibrate_sticks = calibrate_sticks;
exports.reset_check_confirm = reset_check_confirm;
exports.check_firmware_path = check_firmware_path;
exports.send_sololink_command = send_sololink_command;
exports.create_updater_handlers = create_updater_handlers;
