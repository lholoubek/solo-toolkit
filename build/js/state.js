"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Client = require('ssh2').Client;

var Device = function () {
  function Device(successConnectCallback, failureConnectCallback) {
    _classCallCheck(this, Device);

    this.isConnected = false;
    this.versions = {
      app: "",
      solo: "",
      gimbal: "1.2.1",
      pixhawk: "",
      controller: "",
      ssid: "",
      password: ""
    };
    this.connection = new Client();
    this.connection_params = {
      host: '10.1.1.10',
      port: 22,
      username: 'root',
      password: 'TjSDBkAu',
      readyTimeout: 5000
    };
    this.connection.on('ready', function (er) {
      if (er) {
        console.log("Error connecting");
      } else {
        console.log('Client :: ready');
        vehicle.isConnected = true;
        successConnectCallback();
      }
    });
    this.connection.on('error', function (er) {
      console.log("Error occurred");
      console.log(er);
      failureConnectCallback();
    });
  }

  _createClass(Device, [{
    key: "connect",
    value: function connect() {
      this.connection.connect(this.connection_params);
    }
  }]);

  return Device;
}();