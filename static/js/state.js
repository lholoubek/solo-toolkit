var Client = require('ssh2').Client;

class Device {
  constructor(successConnectCallback,failureConnectCallback){
    this.isConnected = false;
    this.versions = {
      solo: "",
      gimbal: "",
      pixhawk: "",
      controller: "",
      ssid: "",
      password: ""
    }
    this.connection = new Client();
    this.connection_params = {
        host: '10.1.1.10',
        port: 22,
        username: 'root',
        password: 'TjSDBkAu',
        readyTimeout: 5000
      }
    this.connection.on('ready', function(er) {
        if(er){
          console.log("Error connecting");
        } else {
            console.log('Client :: ready');
            vehicle.isConnected = true;
            successConnectCallback();
        }
    });
    this.connection.on('error', function(er){
        console.log("Error occurred");
        console.log(er);
        failureConnectCallback();
    });
  }
  connect() {
    this.connection.connect(this.connection_params);
  }
}
