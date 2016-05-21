console.log("Running state.js");
var Client = require('ssh2').Client;
const EventEmitter = require('events');

module.exports = class Device extends EventEmitter{
  constructor(successConnectCallback, disconnectCallback, failureConnectCallback){
    super();
    var self = this;
    //self = this;
    this.controllerConnected = false;
    this.soloConnected = false;
    this.versions = {
      solo_version: " – ",
      gimbal_version: " – ",
      pixhawk_version: " – ",
      controller_version: " – ",
      ssid: " – ",
      password: " – "
    }
    this.controller_connection = new Client();
    this.solo_connection = new Client();

    this.controller_connection_params = {
        host: '10.1.1.1',
        port: 22,
        username: 'root',
        password: 'TjSDBkAu',
        readyTimeout: 2000
    }

    this.controller_connection.on('ready', function(er) {
        if(er){
          console.log("Connection ready but error with controller");
        } else {
            console.log('Controller :: ready');
            self.controllerConnected = true;
            successConnectCallback("controller");
            self.get_controller_version();
        }
    });
    this.controller_connection.on('error', function(er){
        console.log("Error connecting to controller");
        console.log(er);
        self.controller_connection.end(); //end the connection if we have an error
        failureConnectCallback("controller");
    });
    this.controller_connection.on('close', function(){
        console.log("Connection to controller closed");
        disconnectCallback('controller');
    });

    this.solo_connection_params = {
        host: '10.1.1.10',
        port: 22,
        username: 'root',
        password: 'TjSDBkAu',
        readyTimeout: 2000
    }

    this.solo_connection.on('ready', function(er) {
        if(er){
          console.log("Error connecting to solo");
        } else {
            console.log('Solo :: ready');
            self.soloConnected = true;
            self.get_solo_version();
            successConnectCallback("solo");
        }
    });
    this.solo_connection.on('error', function(er){
        console.log("Error connecting to solo");
        console.log(er);
        failureConnectCallback("solo");
        self.solo_connection.end();
    });

    this.solo_connection.on('close', function(){
        console.log("Connection to Solo closed");
        disconnectCallback('solo');
    });
  }

  connect_to_controller() {
    console.log("connect_to_controller called");
    this.controller_connection.connect(this.controller_connection_params);
  };
  connect_to_solo(){
    console.log("Connect to solo called");
    this.solo_connection.connect(this.solo_connection_params);
  };
  disconnect(){
    console.log("disconnect()");
    if (this.controllerConnected === true){
      this.controller_connection.end();
      this.controllerConnected = false;
    }
    if (this.soloConnected === true) {
      this.solo_connection.end();
      this.soloConnected = false;
    }
  }

  get_controller_version(){
    console.log("get_controller_version()");
    var controllerVersion = '';
    var self = this;
    this.controller_connection.sftp(function(err, sftp) {
      if (err) throw err;
      var file = sftp.createReadStream('/VERSION');
      var data = '';
      var chunk = '';
      file.on('readable', function() {
        while ((chunk=file.read()) != null) {
            data += chunk;
        }
      });
      file.on('end', function() {
        var controllerVersion = data.split('\n')[0].trim();
        console.log("pulled controller version: " + controllerVersion);
        console.log(this);
        self.versions.controller_version = controllerVersion;
        self.emit('updated_versions');
      });
    });
  };

  get_solo_version(){
    console.log("get_solo_version()");
    var self = this;
    var solo_version = '';
    var pixhawk_version = '';
    var gimbal_version = '';

    //TODO - Pull this and the similar code above into a helper function (DRY)
    this.solo_connection.sftp(function(err, sftp){
      if (err) throw err;
      var file = sftp.createReadStream('/VERSION');
      var data = '';
      var chunk = '';
      file.on('readable', function() {
        while ((chunk=file.read()) != null) {
            data += chunk;
        }
      });
      file.on('end', function() {
        var solo_version = data.split('\n')[0].trim();
        console.log("pulled solo version: " + solo_version);
        self.versions.solo_version = solo_version;
        self.emit('updated_versions');
      });
    });
  };
};
