'use strict';

/*
This file loads templates from file and compiles them into JS functions.
This JS is run first by index.html to compile templates to be loaded
TODO: Precompile templates as part of gulp build script.
*/

var Handlebars = require('handlebars');
var fs = require('fs');

var template = fs.readFileSync('./static/templates/logs.hbs', 'utf8');
var logs_template = Handlebars.compile(template);

template = fs.readFileSync('./static/templates/settings.hbs', 'utf8');
var settings_template = Handlebars.compile(template);

template = fs.readFileSync('./static/templates/system_info.hbs', 'utf8');
var system_info_template = Handlebars.compile(template);

template = fs.readFileSync('./static/templates/modal.hbs', 'utf8');
var modal_template = Handlebars.compile(template);
console.log("rendered templates");