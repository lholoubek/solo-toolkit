'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

console.log("Running state.js");
var Client = require('ssh2').Client;
var EventEmitter = require('events');

module.exports = function (_EventEmitter) {
  _inherits(Device, _EventEmitter);

  function Device(successConnectCallback, disconnectCallback, failureConnectCallback) {
    _classCallCheck(this, Device);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Device).call(this));

    var self = _this;
    //self = this;
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
        self.get_controller_info();
      }
    });
    _this.controller_connection.on('error', function (er) {
      console.log("Error connecting to controller");
      console.log(er);
      self.controller_connection.end(); //end the connection if we have an error
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
        //When the Solo connection has been established, get the versions
        self.get_vehicle_versions(function () {
          successConnectCallback("solo"); //Once we've parsed the vehicle versions, update!
        });
      }
    });
    _this.solo_connection.on('error', function (er) {
      console.log("Error connecting to solo");
      console.log(er);
      failureConnectCallback("solo");
      self.solo_connection.end();
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
      if (this.controllerConnected === true) {
        this.controller_connection.end();
        this.controllerConnected = false;
      }
      if (this.soloConnected === true) {
        this.solo_connection.end();
        this.soloConnected = false;
      }
    }
  }, {
    key: 'sololink_config_request',
    value: function sololink_config_request(connection, command, callback) {
      //takes SSH connection and returns response from sololink_config
      console.log("sololink_config_request ", command);
      var version = '';
      this.controller_connection.exec(command, function (err, stream) {
        stream.on('data', function (data, stderr) {
          if (stderr) {
            console.log(command + " failed: " + stderr);
          }
          version = data.toString().trim();
          callback(version);
        });
      });
    }
  }, {
    key: 'get_controller_info',
    value: function get_controller_info() {
      console.log("get_controller_info()");
      var controllerVersion = '';
      var self = this;
      var command = 'sololink_config --get-version artoo';
      this.sololink_config_request(this.controller_connection, command, function (version) {
        self.versions.controller_version = version;
        self.emit('updated_versions');
      });
    }
  }, {
    key: 'get_vehicle_info',
    value: function get_vehicle_info(callback) {
      var _this2 = this;

      console.log("get_vehicle_info()");
      var self = this;
      var components = {
        solo: {
          filename: '/VERSION'
        },
        pixhawk: {
          filename: '/PIX_VERSION'
        },
        gimbal: {
          filename: '/AXON_VERSION'
        }
      };

      function update_parsed_versions(components) {
        //This gets called when final version number is parsed
        //Handed components object. Passes those
        console.log("update_versions()");
        console.log(components);

        self.versions.solo_version = components.solo.version;
        self.versions.pixhawk_version = components.pixhawk.version;
        self.versions.gimbal_version = components.gimbal.version;
        console.log("versions", self.versions);
        self.emit('updated_versions');
        if (callback) {
          callback();
        };
      };

      var component_names = Object.keys(components);
      component_names.forEach(function (component_name) {
        var filename = components[component_name].filename;
        _this2.solo_connection.sftp(function (err, sftp) {
          if (err) throw err;
          var file = sftp.createReadStream(filename);
          var data = '';
          var chunk = '';
          file.on('readable', function () {
            while ((chunk = file.read()) != null) {
              data += chunk;
            }
          });
          file.on('end', function () {
            var component_version = data.split('\n')[0].trim(); //just the value on the first line
            console.log("pulled version: " + component_version + " for " + filename);
            components[component_name].version = component_version;
            if (components.solo.version && components.pixhawk.version && components.gimbal.version) {
              //This is a mess. We're checking to make sure we have a version for each before we move one because we can't verify which file will get pulled and parsed first.
              //This sucks. Fix it.
              //TODO - def need to update this to handle this situation better.
              update_parsed_versions(components);
            }
          });
        });
      });
    }
  }]);

  return Device;
}(EventEmitter);