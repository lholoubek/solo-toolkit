console.log("running SoloToolkit.js");
const ipcRenderer = require('electron').ipcRenderer;
const Device = require('./app/js/Device');
const Mousetrap = require('Mousetrap');

//Solo + controller device
let solo = new Device(successConnecting, successDisconnecting, failureConnecting);

solo.on('updated_versions', ()=>{
  //Re-load the system info page when we get updated version info
  if($('#system_info_button').hasClass('active')){ //if the system info mode is active, reload it to show the new data
      view_system_info();
  }
});

let connect_button = $('#connect-button');
$("#connect-progress-bar").hide();
connect_button.on('click', connectButtonClicked);

function connectButtonClicked(){
  console.log("clicked " + connect_button.html() + " button!");
  if (!solo.controllerConnected && !solo.soloConnected){
    console.log("Solo connected: " + solo.soloConnected + " Controller connected: " + solo.controllerConnected);
    solo.connect_to_controller();
    //If controller connects successfully, connection to Solo is attempted.
    connectButtonDisabled();
    connect_button.prop("disabled", true);
    $("#connect-progress-bar").show();
  } else { //something is connected, we should disconnect from everything
    solo.disconnect();
  }
};

//Connection status callbacks
function successConnecting(device){
  console.log("Connected successfully to " + device);
  //Update the connection info in the bottom right of the app
  $("#" + device + "-connection-status").html(" connected");
  $("." + device + "-connection").addClass("active");
  connectButtonConnected(); //Update the connect button
  if (device === "controller"){
    //We're connected to controller successfully, so connect to Solo
    solo.connect_to_solo();
  };
};
function failureConnecting(device){
  // Called if we encounter an error trying to connect to either Solo or controller
  // Will display a 'failure connecting' message to the user
  console.log("Error or disconnection from " + device);
  $("#" + device + "-connection-status").html(" disconnected");
  $("." + device + "-connection").removeClass("active");
  connection_error_message(device);
  if (device === "controller"){
    connectButtonEnabled();
  }
};
function successDisconnecting(device, message){
  // Called if we successfully disconnect from a device (like when Disconnect button pressed)
  // Will not display a message to the user
  console.log("Successfully disconnected from " + device);
  $("#" + device + "-connection-status").html(" disconnected");
  $("." + device + "-connection").removeClass("active");
  if (device === "controller"){ //If we're not connected to controller, good chance we're not going to be connected to Solo
    connectButtonEnabled();
    solo.controllerConnected = false;
  } else {
    solo.soloConnected = false;
  }
  if (message){
    display_overlay("connection", `Disconnected from ${message}`, `Check connections.`);
  }
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
  if (device_name === "controller") {
      display_overlay("connection","Could not connect to controller", "No connection to controller available. Check your wifi connection.");
    } else {
      display_overlay("connection", "Could not connect to Solo", "No connection to Solo is available. Try power cycling Solo.");
    }
};


//OVERLAYS
let overlay_options = {
  'keyboard': true, // teardown when <esc> key is pressed (default: true)
  'static': false, // maintain overlay when clicked (default: false)
  'onclose': function() {} // execute function when overlay is closed
};

function display_overlay(type, heading, body, options){
  console.log("display_overlay()");
  /*param (String) type - type of modal (defaults to error)
  Available types:
  'error' - error dialog
  'settings' – settings dialog

  param {String} heading - heading for the modal
  param {String} body - body text for the dialog
  param {Object} options - optional options Object
  Example -
  {
    image: "<img src='./app/assets/img/stick_cal.gif' class='settings-image' alt='stick calibration'>",
    cancel_button: true,   //off by default
    confirm_button: true,  //true by default
    button_text: "Confirm"
  }
  */
  //determine the type of modal to display (error or setting)
  let conformed_type = '';
  type = type.toLowerCase().trim();

  switch (type){
    case "error":
      conformed_type = 'warning';
      break;
    case "settings":
      conformed_type = "settings";
      break
    case "connection":
      conformed_type = "signal_wifi_off";
      break;
  }
  let modal_dialog = document.createElement('div');
  let modal_options = {
    static: true
  }
  modal_dialog.style.width = '50%';
  modal_dialog.style.height = 'fit-content';
  modal_dialog.style.margin = '100px auto';
  modal_dialog.style.backgroundColor = '#fff';
  modal_dialog.innerHTML = modal_template({modal_type: conformed_type, modal_heading: heading, modal_body: body});
  mui.overlay('on', modal_options, modal_dialog); //this inserts the div into the DOM and makes the optional-el div available to jquery
  let optional_button = $('#optional-button');
  let optional_image_el = $("#optional-image-el");
  if (options){
    console.log("Overlay options passed: ");
    console.log(options);
    if (!options.cancel_button){
      optional_button.hide();
    }
    if (options.button_text){
      $('#modal-button').html(options.button_text);
    }
    if(options.image){
      optional_image_el.html(options.image);
    }
    if(options.confirm_button == false){
      $('#modal-button').hide();
    }
  } else {
    console.log("No options passed to display_overlay");
    optional_button.hide();
    optional_image_el.html('');
  }

  $("#modal-button").click(()=>{
    console.log("close dialog button clicked");
    clear_overlay(modal_dialog);
  });
};

function clear_overlay(){
  console.log("clear_overlay()");
  //@param {Object} dialog - DOM element used to create an overlay, typically the modal_dialog
  mui.overlay('off');
}

//FILE DIALOGS
function getDirectory(input_element){
  //Takes an input html and then requests a dialog chooser
  //When response received from main thread with path, this drops a value in the input
  console.log("getDirectory()");
  let selected_dir = '';
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


// Templates and views
$(document).ready(function load_templates(){
  //Renders all templates on initialization and drops them into their divs
  $('#system-view').html(system_info_template(solo.versions));
  $('#logs-view').html(logs_template());
  $('#settings-view').html(settings_template());

  //switches the view to system info page on first run
  view_system_info();
});


//Attach keyboard shortcuts
$(document).ready(()=>{
  //No keyboard shortcuts attached yet
  //Use Mousetrap to connect keyboard shortcuts
});


//SIDEBAR
//Toggle the active class on sidebar items
let remove_all_active_sidebar = function(){
  console.log("remove_all_active_sidebar");
  //Generic helper for styling sidebar items
  $("#system_info_button").removeClass('active');
  $('#system_info_button >p').removeClass('active');
  $("#log_collection_button").removeClass('active');
  $('#log_collection_button >p').removeClass('active');
  $("#system_settings_button").removeClass('active');
  $('#system_settings_button >p').removeClass('active');
};

let system_info_button = $('#system_info_button');
system_info_button.click(()=>{view_system_info()});
function view_system_info(){
    //If the info page is active, render the menu with the latest versions from the device object
    console.log('view_system_info()');
    let html = system_info_template(solo.versions);
    $("#logs-view").hide();
    $('#settings-view').hide();
    $('#system-view').html(html);
    $('#system-view').show();
    remove_all_active_sidebar();
    system_info_button.addClass('active');
    $('#system_info_button > p').addClass('active');
};

let log_collection_button = $('#log_collection_button');
log_collection_button.click(()=>{load_log_collection()});
function load_log_collection(){
  console.log("load_log_collection()");
  //Hide other views and show this one
  $('#system-view').hide();
  $('#settings-view').hide();
  $("#logs-view").show();
  remove_all_active_sidebar();
  log_collection_button.addClass('active');
  $('#log_collection_button > p').addClass('active');
};

let system_settings_button = $('#system_settings_button');
system_settings_button.click(()=>{load_settings()});
function load_settings(){
  console.log("load_settings()");
  $('#system-view').hide();
  $("#logs-view").hide();
  $('#settings-view').show();
  remove_all_active_sidebar();
  system_settings_button.addClass('active');
  $('#system_settings_button > p').addClass('active');
};

//jQuery to open and close the sidebar menu
jQuery(function($) {
  let $bodyEl = $('body'),
      $sidedrawerEl = $('#sidedrawer');

  function showSidedrawer() {
    // show overlay
    let options = {
      onclose: function() {
        $sidedrawerEl
          .removeClass('active')
          .appendTo(document.body);
      }
    };
    let $overlayEl = $(mui.overlay('on', options));
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

//IF enabled, this code will print the size of the window when it changes
// $(document).ready(()=>{
//   function printSizes(){
//     console.log("Window size - height: " + window.outerHeight.toString() + " width: " + window.outerWidth.toString());
//   }
//   $(window).resize(printSizes, 1000);
// })
