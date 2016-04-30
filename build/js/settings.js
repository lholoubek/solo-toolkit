'use strict';

//reboot button
$('#reboot-button').click(function () {
  ipcRenderer.send('reboot-command', "Reboot!");
  ipcRenderer.on('reboot-reply', reboot);
});
//Param reset
$('#param-reset-button').click(function () {
  param_reset();
});

//Accel calibration
$('#accel-calibration-button').click(function () {
  accel_calibration();
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