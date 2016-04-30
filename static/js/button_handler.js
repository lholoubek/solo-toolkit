var remote = require('remote');
var dialog = remote.require('dialog');

const ipcRenderer = require('electron').ipcRenderer;

//SOLO/CONTROLLER CONNECTIONS
var solo = new Device(successConnecting, successDisconnecting, failureConnecting);

solo.on('updated_versions', ()=>{
  //Re-load the system info page when we get updated version info
  if($('#system_info_button').hasClass('active')){ //if the system info mode is active, reload it to show the new data
      load_system_info();
  }
});

var connect_button = $('#connect-button');
$("#connect-progress-bar").hide();
connect_button.on('click', connectButtonClicked);

function connectButtonClicked(){
  console.log("clicked " + connect_button.html() + " button!");
  if (solo.controllerConnected === false && solo.soloConnected === false){
    console.log("Solo connected: " + solo.soloConnected + " Controller connected: " + solo.controllerConnected);
    solo.connect_to_controller();
    solo.connect_to_solo();
    connectButtonDisabled();
    connect_button.prop("disabled", true);
    $("#connect-progress-bar").show();
  } else { //something is connected, we should disconnect from everything
    solo.disconnect();
  }
};

function successConnecting(device){
  console.log("Connected successfully to " + device);
  //Update the connection info in the bottom right of the app
  $("#" + device + "-connection-status").html(" connected");
  $("." + device + "-connection").addClass("active");
  connectButtonConnected(); //Update the connect button
  load_system_info();
};
function failureConnecting(device){
  console.log("Error or disconnection from " + device);
  $("#" + device + "-connection-status").html(" disconnected");
  $("." + device + "-connection").removeClass("active");
  connection_error_message(device);
  connectButtonEnabled();
};
function successDisconnecting(device){
  console.log("Successfully disconnected from " + device);
  $("#" + device + "-connection-status").html(" disconnected");
  $("." + device + "-connection").removeClass("active");
  connectButtonEnabled();
}

function connectButtonDisabled(){
  connect_button.addClass('disabled');
  connect_button.prop("disabled", true);
};
function connectButtonEnabled(){
  connect_button.html('CONNECT');
  connect_button.removeClass('disabled');
  connect_button.prop("disabled", false);
  $("#connect-progress-bar").hide();
};
function connectButtonConnected(){
  //If we successfully conneced, switch the state of the connect button to enable disconnecting
  connectButtonEnabled();
  connect_button.html("Disconnect");
}

function connection_error_message(device_name){
  display_overlay("This is a test heading", "This is test body text for the modal.");
  //mui.overlay('off');
};

var checkbox = $('#zipfile-log-option');

//Right now this is set up to toggle my checkboxes
connect_button.on('click', function(){
 if(checkbox.prop('checked') === true){
   checkbox.prop('checked', false);
 } else {
   checkbox.prop('checked', true);
  }
});

//OVERLAYS
var overlay_options = {
  'keyboard': true, // teardown when <esc> key is pressed (default: true)
  'static': false, // maintain overlay when clicked (default: false)
  'onclose': function() {} // execute function when overlay is closed
};

function display_overlay(heading, body){
  var modal_dialog = document.createElement('div');
  modal_dialog.style.width = '400px';
  modal_dialog.style.height = '300px';
  modal_dialog.style.margin = '100px auto';
  modal_dialog.style.backgroundColor = '#fff';
  modal_dialog.innerHTML = modal_template({modal_heading: heading, modal_body: body});
  mui.overlay('on', modal_dialog);
};

//FILE DIALOGS
function getDirectory(input_element){
  //Takes an input html and then requests a dialog chooser
  //When response received from main thread with path, this drops a value in the input
  console.log("getDirectory()");
  var selected_dir = '';
  ipcRenderer.send('open-dir-dialog');
  //Listen for one return event to get the path back from the main thread
  ipcRenderer.once('open-dir-dialog-reply', function(e, response){
    if (response.length < 1) {
      console.log("cancelled directory open");
    } else {
      selected_dir = response[0];
      input_element.val(selected_dir);
    }
  });
};


//SIDEBAR
//Toggle the active class on sidebar items
var remove_all_active_sidebar = function(){
  console.log("remove_all_active_sidebar");
  //Generic helper for styling sidebar items
  $("#system_info_button").removeClass('active');
  $('#system_info_button >p').removeClass('active');
  $("#log_collection_button").removeClass('active');
  $('#log_collection_button >p').removeClass('active');
  $("#system_settings_button").removeClass('active');
  $('#system_settings_button >p').removeClass('active');
};

var system_info_button = $('#system_info_button');
system_info_button.click(()=>{load_system_info()});
function load_system_info(){
    //If the info page is active, render the menu with the latest versions from the solo object
    console.log('load_system_info()');
    var html = system_info_template(solo.versions);
    $('#template-container').html(html);
    remove_all_active_sidebar();
    system_info_button.addClass('active');
    $('#system_info_button > p').addClass('active');
};

var log_collection_button = $('#log_collection_button');
log_collection_button.click(()=>{load_log_collection()});
function load_log_collection(){
  console.log("load_log_collection()");
  $('#template-container').html(logs_template());
  remove_all_active_sidebar();
  log_collection_button.addClass('active');
  $('#log_collection_button > p').addClass('active');
};

var system_settings_button = $('#system_settings_button');
system_settings_button.click(()=>{load_settings()});
function load_settings(){
  console.log("load_settings()");
  $('#template-container').html(settings_template());
  remove_all_active_sidebar();
  system_settings_button.addClass('active');
  $('#system_settings_button > p').addClass('active');
};


//jqury to open and close the sidebar menu
jQuery(function($) {
  var $bodyEl = $('body'),
      $sidedrawerEl = $('#sidedrawer');

  function showSidedrawer() {
    // show overlay
    var options = {
      onclose: function() {
        $sidedrawerEl
          .removeClass('active')
          .appendTo(document.body);
      }
    };
    var $overlayEl = $(mui.overlay('on', options));
    // show element
    $sidedrawerEl.appendTo($overlayEl);
    setTimeout(function() {
      $sidedrawerEl.addClass('active');
    }, 20);
  }

  function hideSidedrawer() {
    $bodyEl.toggleClass('hide-sidedrawer');
  }

  $('.js-show-sidedrawer').on('click', showSidedrawer);
  $('.js-hide-sidedrawer').on('click', hideSidedrawer);
});

$(document).ready(function(){
  //Load the system info page on Load
  load_system_info();
  //Compile our templates

});
