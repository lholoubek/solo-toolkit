'use strict';
const fs = require('fs');
const EventEmitter = require('events');
const helpers = require('./LogfileHelpers');
const Archiver = require('archiver');
const Path = require('path');

//Export LogPuller as a module
module.exports = class LogPuller extends EventEmitter{
  constructor(device) {
    super();
    //var self = this;
    console.log("Created new logpuller");
    this.cancelled = false;
    this.options = {};
  }
  set_log_options(options){
    //@param {object} options - log puller options

    /*Sample options object:
    {
      output_path:"",
      log_folder_name: "",
      solo_logs:false,
      controller_logs:false,
      collect_all_logs:false,
      num_logs:0,
      create_zip:false,
      log_notes:""
    };*/
    this.options = options;
  }

  set_device(device){
    this.device = device;
  }

  set_progress_callback(progressCallback){
    //@param {function} progressCallback - function(int)
    //Callback is called as progress is made on a given task
    //Currently used to update the progress bar and add message
    this.progressCallback = progressCallback;
  }

  start_log_pull(){
    //This method does a few things:
    // - Emits event to notify UI that log pulling has started
    // - Calls pull_logs for Solo and/or controller, depending on selected option
    var self = this;
    console.log("start_log_pull");
    console.log('emitting start-pull');
    if (this.create_log_folders(self) == false){
      this.emit('folder-already-exists');
      return;
    };
    this.emit('start-pull');  //notify UI that the log pull has started

    self.pull_logs(self.device.controller_connection, "controller", self.options.controller_log_folder_path, self.options.controller_logs, ()=>{
      self.pull_logs(self.device.solo_connection, "solo", self.options.solo_log_folder_path, self.options.solo_logs, ()=>{
        // This is the callback called by this.pull_logs when it finishes pulling logs
        self.add_log_notes(()=>{  // Add log notes (skips if there are none)
          self.zip_logs_dir(()=>{ // zip up the logs folder
            console.log("Completed start_log_pull()");
            self.progressCallback(100, "All logs pulled");
            setTimeout(1000, self.progressCallback(0));
            this.emit('cancelled');
          });
        });
      });
    });
  };

  pull_logs(connection, device_name, path, option, cb){
    //@param {object} connection - SSH connection
    //@param {String} log_folder_path - path to log folder
    //@param {function} cb - callback to call when complete
    //using passed connection, this function sets up sftp connection
    //pulls log files into correct path, then calls callback
    var self = this;

    if (!self.cancelled && option){
      var log_folder_path = path;  //depending on options, this folder will already exists when it's created with create_log_folders()
      connection.sftp((err, sftp)=>{
        console.log("Trying to connect to pull logs");
        if (err) {
          self.cancel();
          throw err;
        }
        let base_path = '/log';

        // partially apply our progressCallback before passing it to asyncFilePull
        let progress = percentage => self.progressCallback(percentage, `Transfering files from ${device_name}...`);
        let isCancelled = ()=>{  // Wrap this method so we don't have to pass context to the helper function to call this method
          return self.isCancelled();
        }
        sftp.readdir(base_path, (err, list)=>{  // /log contains logs on solo and controller
          if (err) {
            console.log("Couldn't find /log directory to pull files from");
            self.cancel();
            throw err;
          }
          let file_list = helpers.fileListFromDirList(list, self.options.collect_all_logs, self.options.num_logs, false);
          helpers.asyncFilePull(sftp, file_list, base_path, log_folder_path, isCancelled, progress, ()=>{
            if (device_name == "solo"){ // If we're pulling logs from Solo, check to see if we have any R10C data available
              base_path = '/data/r10c';
              sftp.readdir(base_path, (err, list)=>{
                if (err) {
                  console.log("couldn't find R10C data on Solo");
                  cb();
                } else {
                  console.log(list);
                  file_list = helpers.fileListFromDirList(list, true, null, true);
                  console.log("Should be some text files: " + file_list);
                  helpers.asyncFilePull(sftp, file_list, base_path, Path.dirname(log_folder_path) + "/geodata", isCancelled, ()=>{},()=>{
                    cb();
                  });
                }
              })
            } else cb(); // If we're not pulling from Solo (we're pulling from controller), return here
          });
        });
      });
    } else {
      console.log("didn't want to collect logs from ", device_name);
      cb();
    }
  };

  cancel(){
    //Cancels any current logpull operation
    console.log("LogPuller.cancel()");
    this.progressCallback(0, "Log transfer cancelled");
    setTimeout(2500, this.progressCallback(0, ''));
    this.emit('cancelled');
    this.cancelled = true;
  };

  isCancelled(){
    return this.cancelled;
  }

  create_log_folders(context){
    //Synchronous log folder creation
    //Top level folder is provided in options.log_folder_name (timestamp-based)
    //Creates subfolders as needed for controller and solo logs based on options
    // Returns true if successful, false if not
    var self = context;
    console.log("create_log_folder() called - trying to create a folder for the logs");
    console.log("folder name: " + self.options.log_folder_name);
    try {
      fs.mkdirSync(self.options.log_folder_name);
      if(this.options.controller_logs){
        this.options.controller_log_folder_path = self.options.log_folder_name + "/controller";
        fs.mkdirSync(this.options.controller_log_folder_path);
      }
      if (this.options.solo_logs){
        this.options.solo_log_folder_path = self.options.log_folder_name + "/solo";
        fs.mkdirSync(this.options.solo_log_folder_path);
        fs.mkdirSync(this.options.log_folder_name + "/geodata");
      }
      return true;
    } catch(err){
      console.log("err in folder creation: ", err);
      if (err.code != 'EEXIST'){
        console.log("Unknown error trying to create log folder - ", err);
      } else {
          console.log("Log folder already exists. ");
      }
      return false;
    }
  };

  add_log_notes(cb){
    let versions = this.device.versions;
    let version_strings = [
      "Sololink: " + versions.sololink_version,
      "Gimbal: " + versions.gimbal_version,
      "Pixhawk: " + versions.pixhawk_version,
      "Controller: " + versions.controller_version
    ];

    let version_message = "Retrieved: " + helpers.generate_date_string() + "\n\nVersions \n–––––––––\n" + version_strings.join("\n");
    if (this.options.log_notes.length >1){
      version_message += "\n\n Notes\n––––––––\n" + this.options.log_notes;
    }

    fs.writeFile(this.options.log_folder_name + "/Notes.txt", version_message, (err)=>{
      console.log(this.options.log_folder_name + "/Notes.txt");
      if (err){
        console.log("Failed to write notes.txt");
        console.log(err);
      }
      cb();
    });
  }

  zip_logs_dir(cb){
    //Zip the log files
    if (this.options.create_zip && !this.cancelled){
      console.log("zipping logfiles...");
      var zipdir_path = this.options.log_folder_name;  //step up one level from the folder with logs
      console.log("zipdir_path - ", zipdir_path);
      var zipdir = "/" + this.options.log_folder_name.split("/")[this.options.log_folder_name.split("/").length - 1];  //get just the timestamp filename
      console.log("zipdir - ", zipdir);
      var zipfile = this.options.output_path + zipdir + ".zip";
      console.log('zipfile - ', zipfile);
      var zipper = Archiver.create('zip', {});

      var out_stream = fs.createWriteStream(zipfile, {flags: 'w'});
      // out_stream.on('close', ()=>{
      //   console.log("stream closed...");
      // });
      zipper.pipe(out_stream);
      zipper.directory(zipdir_path, zipdir); //put the files in the root of the zipdir
      console.log("made it past zipper.directory...");
      out_stream.on('close', ()=>{ //When we call finalize() below, the 'close' event will be emitted.
        console.log("zipfile write stream closed");
        cb();
      })
      zipper.finalize();
    } else cb();
  }
  //end of class
};
