'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Client = require('ssh2').Client;
var EventEmitter = require('events');

var Device = function (_EventEmitter) {
  _inherits(Device, _EventEmitter);

  function Device(successConnectCallback, disconnectCallback, failureConnectCallback) {
    _classCallCheck(this, Device);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Device).call(this));

    self = _this;
    _this.controllerConnected = false;
    _this.soloConnected = false;
    _this.versions = {
      solo_version: " – ",
      gimbal_version: " – ",
      pixhawk_version: " – ",
      controller_version: " – ",
      ssid: " – ",
      password: " – "
    };
    _this.controller_connection = new Client();
    _this.solo_connection = new Client();

    _this.controller_connection_params = {
      host: '10.1.1.1',
      port: 22,
      username: 'root',
      password: 'TjSDBkAu',
      readyTimeout: 2000
    };
    _this.controller_connection.on('ready', function (er) {
      if (er) {
        console.log("Connection ready but error with controller");
      } else {
        console.log('Controller :: ready');
        self.controllerConnected = true;
        successConnectCallback("controller");
        self.get_controller_version();
      }
    });
    _this.controller_connection.on('error', function (er) {
      console.log("Error connecting to controller");
      console.log(er);
      this.end(); //end the connection if we have an error
      failureConnectCallback("controller");
    });
    _this.controller_connection.on('close', function () {
      console.log("Connection to controller closed");
      disconnectCallback('controller');
    });

    _this.solo_connection_params = {
      host: '10.1.1.10',
      port: 22,
      username: 'root',
      password: 'TjSDBkAu',
      readyTimeout: 2000
    };
    _this.solo_connection.on('ready', function (er) {
      if (er) {
        console.log("Error connecting to solo");
      } else {
        console.log('Solo :: ready');
        self.soloConnected = true;
        self.get_solo_version();
        successConnectCallback("solo");
      }
    });
    _this.solo_connection.on('error', function (er) {
      console.log("Error connecting to solo");
      console.log(er);
      this.end();
      failureConnectCallback("solo");
    });
    _this.solo_connection.on('close', function () {
      console.log("Connection to Solo closed");
      disconnectCallback('solo');
    });
    return _this;
  }

  _createClass(Device, [{
    key: 'connect_to_controller',
    value: function connect_to_controller() {
      console.log("connect_to_controller called");
      this.controller_connection.connect(this.controller_connection_params);
    }
  }, {
    key: 'connect_to_solo',
    value: function connect_to_solo() {
      console.log("Connect to solo called");
      this.solo_connection.connect(this.solo_connection_params);
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      console.log("disconnect()");
      if (self.controllerConnected === true) {
        self.controller_connection.end();
        self.controllerConnected = false;
      }
      if (self.soloConnected === true) {
        self.solo_connection.end();
        self.soloConnected = false;
      }
    }
  }, {
    key: 'get_controller_version',
    value: function get_controller_version() {
      console.log("get_controller_version()");
      var controllerVersion = '';
      this.controller_connection.sftp(function (err, sftp) {
        if (err) throw err;
        var file = sftp.createReadStream('/VERSION');
        var data = '';
        var chunk = '';
        file.on('readable', function () {
          while ((chunk = file.read()) != null) {
            data += chunk;
          }
        });
        file.on('end', function () {
          controllerVersion = data.split('\n')[0].trim();
          console.log("pulled controller version: " + controllerVersion);
          self.versions.controller_version = controllerVersion;
          self.emit('updated_versions');
        });
      });
    }
  }, {
    key: 'get_solo_version',
    value: function get_solo_version() {
      console.log("get_solo_version()");
      var solo_version = '';
      var pixhawk_version = '';
      var gimbal_version = '';
      this.solo_connection.sftp(function (err, sftp) {
        if (err) throw err;
        var file = sftp.createReadStream('/VERSION');
        var data = '';
        var chunk = '';
        file.on('readable', function () {
          while ((chunk = file.read()) != null) {
            data += chunk;
          }
        });
        file.on('end', function () {
          var solo_version = data.split('\n')[0].trim();
          console.log("pulled solo version: " + solo_version);
          self.versions.solo_version = solo_version;
          self.emit('updated_versions');
        });
      });
    }
  }]);

  return Device;
}(EventEmitter);