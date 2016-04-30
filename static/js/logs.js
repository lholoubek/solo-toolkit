$('#collect-logs-button').on('click', ()=>{
  //First get the settings to determine what logs we need to get from where
  var logs_options = build_logs_options();
  console.log(logs_options);

});

//Set up our output path directory chooser
$('#open-file-button').on('click', function(){
  console.log("pressed #open-file-button");
  // mui.overlay('on', overlay_options);
  var output_path_element = $('#location-chooser-text');
  getDirectory(output_path_element);
});

function build_logs_options(){
  //Creates logs_options object, parses the DOM, and fills out corresponding fields in the object, then returns it
  var logs_options = {
    output_path:"",
    solo_logs:false,
    controller_logs:false,
    collect_all_logs:false,
    num_logs:0,
    create_zip:false,
    flight_notes:""
  };
  //Get the output path
  var path = $('#location-chooser-text').val();
  //TODO - Make this work across systems and pull a default path from a user default
  path.length < 1 ? logs_options.output_path = "~/Desktop" : logs_options.output_path = path

  //Check if the user wants to collect Solo logs
  if ($('#solo-logs-option').prop('checked')){
    logs_options.solo_logs = true;
  }
  //Check if the user wants to collect controller logs
  if ($('#controller-log-option').prop('checked')){
    logs_options.controller_logs = true;
  }
  //Check how many logs the user wants collected
  var num = $('#num-logs-select option:selected').text();
  num.toLowerCase() === "all" ? logs_options.collect_all_logs = true : logs_options.num_logs = parseInt(num);

  //check whether we need to create a zipfile
  if ($('#zipfile-log-option').prop('checked')){
    logs_options.create_zip = true;
  }
  //Parse the flight notes
  var notes = $('#flight-notes').val();
  logs_options.flight_notes = notes;

  return logs_options;
}
