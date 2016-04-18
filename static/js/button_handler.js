var remote = require('remote');
var dialog = remote.require('dialog');
var handlebars = require('handlebars');
var fs = require('fs');
const ipcRenderer = require('electron').ipcRenderer;

var overlay_options = {
  'keyboard': true, // teardown when <esc> key is pressed (default: true)
  'static': false, // maintain overlay when clicked (default: false)
  'onclose': function() {} // execute function when overlay is closed
};

$('#open-file-button').on('click', function(){
  console.log("pressed #open-file-button");
  // mui.overlay('on', overlay_options);
  // openFile();
});

var vehicle = new Device(successConnecting, failureConnecting);

var connect_button = $('#connect-button');
$("#connect-progress-bar").hide();
connect_button.on('click', connectButtonClicked);

function connectButtonClicked(){
  console.log("clicked connect!");
  vehicle.connect();
  connectButtonDisabled();
  connect_button.prop("disabled", true);
  $("#connect-progress-bar").show();
}
function successConnecting(){
  console.log("Connected successfully!");
  connectButtonEnabled();
};
function failureConnecting(){
  console.log("Error trying to connect, try again");
  connectButtonEnabled();
}
function connectButtonDisabled(){
  connect_button.addClass('disabled');
  connect_button.prop("disabled", true);
  connect_button.off("click");
};
function connectButtonEnabled(){
  connect_button.removeClass('disabled');
  connect_button.prop("disabled", false);
  connect_button.on('click', connectButtonClicked);
  $("#connect-progress-bar").hide();
};


function attach_settings_handlers(){
    //reboot button
    $('#reboot-button').click(() => {
      ipcRenderer.send('reboot-command', "Reboot!");
      ipcRenderer.on('reboot-reply', reboot);
    });
    //Param reset
    $('#param-reset-button').click(() => {
      param_reset();
    });

    //Accel calibration
    $('#accel-calibration-button').click(() =>{
      accel_calibration();
    });

    //Stick calibration


    //File chooser


    //Flash firmware


    //Arm motors
};

function attach_logs_handlers(){


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

//SIDEBAR
//Toggle the active class on sidebar items
var system_info_button = $('#system_info_button');
system_info_button.click(function(){
  remove_all_active_sidebar();
  system_info_button.addClass('active');
  $('#system_info_button > p').addClass('active');

});
var log_collection_button = $('#log_collection_button');
log_collection_button.click(function(){
  remove_all_active_sidebar();
  log_collection_button.addClass('active');
  $('#log_collection_button > p').addClass('active');
});
var system_settings_button = $('#system_settings_button');
system_settings_button.click(function(){
  remove_all_active_sidebar();
  system_settings_button.addClass('active');
  $('#system_settings_button > p').addClass('active');
});

var remove_all_active_sidebar = function(){
  system_info_button.removeClass('active');
  $('#system_info_button >p').removeClass('active');
  log_collection_button.removeClass('active');
  $('#log_collection_button >p').removeClass('active');
  system_settings_button.removeClass('active');
  $('#system_settings_button >p').removeClass('active');
};


//CODE FOR TEMPLATES AND PAGES
system_info_button.click(function(){
  console.log('attempting to set inner html');
  var template = fs.readFileSync('./static/templates/system_info.hbs', 'utf8');
  var compiled_template = handlebars.compile(template);
  $('#template-container').html(compiled_template);
});
log_collection_button.click(function(){
  var template = fs.readFileSync('./static/templates/logs.hbs', 'utf8');
  var compiled_template = handlebars.compile(template);
  $('#template-container').html(compiled_template);
  attach_logs_handlers();
});
system_settings_button.click(function(){
  var template = fs.readFileSync('./static/templates/settings.hbs', 'utf8');
  var compiled_template = handlebars.compile(template);
  $('#template-container').html(compiled_template);
  attach_settings_handlers();
});


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
