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
    this.set_up(()=>{
      this.emit('update-set-up');
      this.transfer(()=>{
        this.check_md5(()=>{
          this.init(()=>{
            console.log("updated started on " + this.name);
            this.emit('update-started'); // update has started, we can disconnect
          });
        })
      });
    });
  }

  set_up(callback){
    console.log("Updater - set_up");
    console.log(this.device);
    //Sets up the device for the update using Sololink config
    sh.send_sololink_command(`${this.name}`, "--update-prepare sololink", this.device.connection, (err, stream)=>{
      if (err) {
        this.emit('error','Failed to prepare update on Solo');
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
    console.log("Updater - transfer");
    // Transfers the update file from a local path to the device
    console.log(this.device.connection);
    console.log(this.local_path);
    this.device.connection.sftp((err, sftp)=>{
      if (err) throw err;
      sftp.fastPut(this.local_path + `/${this.device.files.tarball}`,
        '/log/updates/' + this.device.files.tarball,
        {step:(total_transferred, chunk, total)=>{
          this.progress_update_filter(total_transferred, chunk, total);  // this is a bit nasty but necessary to make sure 'this' in our progress_update_filter has the write context
        }},
     (err)=>{
        if (err) {
          throw err;
          console.log(err);
          self.emit('error', "Failed to transfer update to " + device);
          return;
        } else {  // successfully transferred the first file
          console.log("No errors transferring tarball");
          sftp.fastPut(this.local_path + "/"+ this.device.files.md5,
          '/log/updates/' + this.device.files.md5,
          (err)=>{
            if (err) callback(err);
            callback();
          });
         }
      });
    });
  }

  check_md5(callback){
    console.log("Updater - check_md5");
    console.log(this.device.files);
    let md5_on_vehicle = '';
    fs.readFile(`${this.local_path}/${this.device.files.md5}`, (err, data)=>{
      if (err) throw err;
      let md5_file_val = data.toString();
      this.device.connection.exec(`cd /log/updates && md5sum ${this.device.files.tarball}`, (err, stream)=>{
        stream.on('data', (data)=>{
          let string_data = data.toString();
          md5_on_vehicle = md5_on_vehicle + string_data;
        });
        stream.on('exit', (code)=>{
          if (code == 0){
            console.log("received md5sum from vehicle. Comparing...");
            console.log(md5_on_vehicle);
            console.log(md5_file_val);
            if (md5_on_vehicle == md5_file_val){
              console.log("md5's are the same. proceeding with update...");
              callback();
            } else {
              this.emit('error', `Update on ${this.name} is corrupted.`);
              return;
            }
          } else this.emit('error', "Error verifying update on device");
        })
      });
    });
  }

  init(callback){
    console.log("Updater - init");
    sh.send_sololink_command(`${this.name}`, "--update-apply sololink", this.device.connection, (err, stream)=>{
      if (err) {
        this.emit('error', 'Failed to prepare update on Solo');
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
    console.log("Updater - set_device");
    console.log(update_device);
    // @param {Object} update device - pass in an update device object
    this.device = update_device;
  }

  set_local_path(path){
    console.log("Updater - set_local_path");
    this.local_path = path;
  }

  set_next(cb){
    // optional callback that will be called at the end of the update() routine. Used to chain multiple Updaters together sequentially
    this.next = cb;
  }

  // helpers
  progress_update_filter(total_transferred, chunk, total){
    var message = "Transferring update to " + this.name;
    var newVal = (total_transferred/total)*100;
    this.emit('progress', newVal, message);
  }
}
