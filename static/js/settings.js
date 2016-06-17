const readline = require('readline');
const sh = require('./build/js/SettingsHelpers');

$('#stick-calibration-button').click(()=>{
  console.log("stick_cal called");
  //DEBUGGING
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
    display_overlay("error", "Not connected to controller", "You must connect to your controller before calibrating. Check your wifi connection.");
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

//Accel calibration
$('#accel-calibration-button').click(() =>{
  accel_calibration();
});

//Accel calibration
$('#accel-calibration-button').click(() =>{
  accel_calibration();
});



// var reboot = function(event, arg){ //this gets called from the main process; needs to handle an event and an argument
//   console.log(arg);
// };

function param_reset(){
  console.log("param_reset called");
};
