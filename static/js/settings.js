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

$('#stick-calibration-button').click(()=>{
  console.log("stick_cal called");
  if (solo.controllerConnected){
    calibrate_sticks();
  } else {
    //display_overlay("error", "Not connected to controller", "You must connect to your controller before calibrating. Check your wifi connection.");
    calibrate_sticks();
  }
});


var reboot = function(event, arg){ //this gets called from the main process; needs to handle an event and an argument
  console.log(arg);
};


function param_reset(){
  console.log("param_reset called");
};


function accel_calibration(){
  console.log("accel_calibration called");
};

function calibrate_sticks(){
  console.log("calibrate_sticks()");
  solo.controller_connection.exec('runStickCal.sh', function(err, stream){
    console.log("Connecting to stick cal");
    if(err){
      display_overlay("error", "Calibration error", "An error occurred while running stick cal");
    }
    display_overlay("settings",
                    "Stick Calibration",
                    "Calibrate your sticks by moving all sticks to every position.",
                    "<img src='./build/assets/img/stick_cal.gif' class='settings-image' alt='stick calibration'>");
    stream.on("data", function(data){
      console.log(data);
    });
  });

  // display_overlay("settings",
  //                 "Stick Calibration",
  //                 "Calibrate your sticks by moving all sticks to every position.",
  //                 "<img src='./build/assets/img/stick_cal.gif' class='settings-image' alt='stick calibration'>");
};
