"use strict";

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