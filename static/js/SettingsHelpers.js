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
      let modal_options = {image:"<img src='./build/assets/img/stick_cal.gif' class='settings-image' alt='stick calibration'>", button_text:"Complete"};
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

  //if (solo.controllerConnected){
  if(true){
   let connected_devices = solo.soloConnected ? "controller and Solo" :"controller";
   let reset_message = "Select reset to initiate a " + reset_type + " reset of " + connected_devices;
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
  let command = reset_type == 'factory' ? '--factory-reset':'--settings-reset';
  console.log("Command: ", command);
  let modal_options = {
    cancel_button: false,
    confirm_button: false
  }
  if (device.solo){
    console.log("Trying to reset Solo...");
    send_reset_command('solo', command, device.solo, (device, err, stream)=>{
      if (err){
        display_overlay('error', reset_type + ' reset', reset_type + ' reset on Solo failed.', {cancel_button:false, confirm_button:true});
        return;
      }
      stream.on('exit', (code)=>{
        if(code == 0){
          console.log("Solo reset successfully");
          device.solo.end();
          factory_reset_notify('solo', command);
        } else display_overlay('error', reset_type +" reset error", "Encountered an error while initiating " + reset_type + " reset.", {cancel_button: false});
      });
    });
  }
  //TODO - IMPLEMENT OPTIONAL FACTORY RESET OF EACH DEVICE INSTEAD OF ALWAYS RESETTING CONTROLLER
  send_reset_command('controller', command, device.controller, (device_name, err, stream)=>{
      if(err){
        display_overlay('error', reset_type + ' reset', reset_type + ' reset on Controller failed.', {cancel_button:false, confirm_button:true});
        return
      }
      stream.on('exit', (code)=>{
        if(code == 0 ){
            console.log("Controller reset successfully");
            device.controller.end();
            factory_reset_notify('controller', command);
        } else display_overlay('error', reset_type +" reset error", "Encountered an error while initiating " + reset_type + " reset.", {cancel_button: false});
      });
  });
};

function factory_reset_notify(device_name, command){
  //called when a factory reset has been initiated successfully on a device
  //@param {String} started - "solo", "controller", "both"
  console.log("factory_reset_notify() ", device_name);

  let reset_type = command == "--factory-reset" ? "Factory" : "Settings";  //sets reset type based on command being issued
  display_overlay('settings',
                  reset_type + ' reset',
                  reset_type + ' reset initiated. Re-connect when controller indicates that factory reset has completed.',
                  {image:"<img src='./build/assets/img/factory_reset_complete.png' class='settings-image' alt='stick calibration'>",
                                                                            cancel_button: false});
}

function send_reset_command(device_name, command, connection, callback){
  //@param {String} device - "solo" or 'controller'
  //@param {Object} ssh connection - ssh session with solo or controller
  //@param {function} callback -  callback function accepting stream and error
  console.log("send_reset_command - ", device_name, command);
  connection.exec('sololink_config '+ command, (err, stream)=>{
    if (err) {
      console.error("Blew up trying to reset " + device_name + " " + command);
      callback(device_name, err);
    }

    callback(device_name, err, stream);
  })
}

exports.calibrate_sticks = calibrate_sticks;
exports.reset_check_confirm = reset_check_confirm;
