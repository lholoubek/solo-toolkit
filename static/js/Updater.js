"use strict";
const _ = require('Underscore');
const EventEmitter = require('events');
const readline = require('readline');
const sh = require('./SettingsHelpers');

module.exports = class Updater extends EventEmitter {
  constructor (name){
    super();
    this.name = name;
  }

  update(){
    set_up(()=>{
      this.emit('update-set-up');
      transfer(()=>{
        check_md5(()=>{
          init(()=>{
            this.emit('update-started'); // update has started, we can disconnect
            if(this.next) this.next();
          });
        })
      });
    });
  }

  set_up(callback){
    //Sets up the device for the update using Sololink config
    sh.send_sololink_command(`${this.name}`, "--update-prepare sololink", this.device.connection, (err, stream)=>{
      if (err) {
        error_messager('Failed to prepare update on Solo');
        return;
      }
      stream.on('exit', (code)=>{
        if (code == 0){
          console.log(`Successfully prepped ${this.name} for update`);
          callback();
        }
      })
    })
  }

  transfer(callback){
    // Transfers the update file from a local path to the device
    this.device.connection.sftp((err, sftp)=>{
      if (err) callback(err);
      sftp.fastput(this.device.path, '/log/updates', {step:this.progress_update_filter}, (err)=>{
        if (err) {
          error_messager("Failed to transfer update to " + device);
          return;
        } else callback();
      });
    });
  }

  check_md5(callback){
    let md5_on_vehicle = '';
    fs.readFile(`${this.device.path} + '\' + ${this.device.files.md5}`, (err, data)=>{
      if (err) throw err;
      let md5_file_val = data;
      this.device.connection.exec(`md5sum /log/updates/${this.device.files.md5}`, (err, stream)=>{
        stream.on('data', (data)=.{
          let string_data = data.toString();
          md5_on_vehicle = md5_on_vehicle + string_data;
        });
        stream.on('exit', (code)=>{
          if (code == 0){
            console.log("received md5sum from vehicle. Comparing...");
            if (md5_on_vehicle == md5_file_val){
              console.log("md5's are the same. proceeding with update...");
              callback();
            } else {
              error_messager(`Update on ${this.name} is corrupted.`);
              return;
            }
          } else error_messager("Error verifying update on device");
        })
      });
    });
  }

  init(callback){
    sh.send_sololink_command(`${this.name}`, "--update-apply sololink", this.device.connection, (err, stream)=>{
      if (err) {
        error_messager('Failed to prepare update on Solo');
        return;
      }
      stream.on('exit', (code)=>{
        if (code == 0){
          console.log(`Successfully applied update on ${this.name}`);
          callback();
        }
      })
    })
  }

  set_device(update_device){
    // @param {Object} update device - pass in an update device object
    this.device = update_device;
  }

  set_next(cb){
    // optional callback that will be called at the end of the update() routine. Used to chain multiple Updaters together sequentially
    this.next = cb;
  }

  // helpers
  progress_update_filter(total_transferred, chunk, total){
    var message = "Transferring update to " + this.name;
    var newVal = total_transferred/total;
    console.log("Progress update filter: ", newVal);
    this.emit('progress', newVal, message);
  }
}
