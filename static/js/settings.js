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
    display_overlay('settings', "Running stick calibration", "Initiating stick calibration on controller...");
    setTimeout(calibrate_sticks(), 1500);
  } else {
    display_overlay("error", "Not connected to controller", "You must connect to your controller before calibrating. Check your wifi connection.");
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
  solo.controller_connection.shell(function(err, stream){
    console.log("Connecting to stick cal");
    if(err){
      display_overlay("error", "Calibration error", "An error occurred while running stick cal.");
    }
    stream.setEncoding('utf8');
    // stream.write('runStickCal.sh');
    stream.once("data", function(data){
      console.log("Received data");
      stream.write("runStickCal.sh\n");
      setTimeout(()=>{
        console.log("stick cal ran for 20s. Killing connection.");
        solo.controller_connection.end();
      }, 20000);
      display_overlay("settings",
                      "Stick Calibration",
                      "Calibrate your sticks by moving all sticks to every position.",
                      "<img src='./build/assets/img/stick_cal.gif' class='settings-image' alt='stick calibration'>");
      console.log("attaching event handler");
      $('#modal-button').off('click');
      $('#modal-button').on('click', function () {
        console.log("attempting to end calibration step");
        stream.write("\x03");
      });
    });
    stream.on('data', (data)=>{
      console.log(data.toString());
    });
  });

  console.log("exec call returned");

};
