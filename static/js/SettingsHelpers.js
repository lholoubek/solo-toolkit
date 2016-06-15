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
        connection.end();
      }, 20000);
      let modal_options = {image:"<img src='./build/assets/img/stick_cal.gif' class='settings-image' alt='stick calibration'>"};
      display_overlay("settings",
                      "Stick Calibration",
                      "Calibrate your sticks by moving all sticks to every position.",
                      modal_options);
      $('#modal-button').off('click');
      $('#modal-button').on('click', function () {
        console.log("user ended calibration");
        stream.write("\x03");
      });
    });
    stream.on('data', (data)=>{
      console.log(data.toString());
    });
  });
  console.log("exec call returned");
};

function factory_reset(solo_connection, controller_connection){
  //requests a factory reset on the specified connection
  console.log("factory_reset()", connection.toString());
  let modal_options = {
    cancel_button: false,
    confirm_button: false
  }
  if (solo_connection){
    let solo_stream = call_factory_reset(solo_connection);
    solo_strea.on('data', ()=>{
      display_overlay('settings', 'Factory reset', 'Factory reset initiated on Solo', modal_options);
      setTimeout(factory_reset_controller, 2500);  //Make sure Solo reset is proceeding before initiating factory reset on controller
    })
  } else {
    factory_reset_controller(controller_connection); //if no Solo is connected skip right to the controller
  }
};

function factory_reset_controller(connection){
  let stream = call_factory_reset(connection)
  let modal_options = {
    cancel_button: false
  }
  stream.on('data', ()=>{
    display_overlay("settings", "Factory reset", "Factory reset has been initiated on Solo and controller.\
                                                  Devices will need to be re-paired once the factory reset\
                                                  procedure is completed", modal_options);
  });
};

function call_factory_reset(connection){
  connection.exec('sololink_config --factory-reset', (err, stream)=>{
    if (err) throw err;
    return stream;
  })
}

exports.calibrate_sticks = calibrate_sticks;
exports.factory_reset = factory_reset;
