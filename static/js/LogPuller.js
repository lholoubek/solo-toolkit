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
    Logger.info('created LogPuller instance')
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
    Logger.info("LogPuller: start_log_pull")
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
        Logger.info('Trying to connect to pull logs');
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
            Logger.warn("Couldn't find /log directory to pull files from")
            self.cancel();
            throw err;
          }
          let file_list = helpers.fileListFromDirList(list, self.options.collect_all_logs, self.options.num_logs);
          helpers.asyncFilePull(sftp, file_list, base_path, log_folder_path, isCancelled, progress, ()=>{
            if (device_name == "solo"){ // If we're pulling logs from Solo, check to see if we have any R10C data available
              base_path = '/data/r10c';
              sftp.readdir(base_path, (err, list)=>{
                if (err) {
                  Logger.warn("couldn't find R10C data on Solo");
                  cb();
                } else {
                  Logger.log('info',list);
                  file_list = helpers.fileListFromDirList(list, true, null);
                  Logger.log('info',"Should be some text files: " + file_list);
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
      Logger.log('info',"didn't want to collect logs from ", device_name);
      cb();
    }
  };

  cancel(){
    //Cancels any current logpull operation
    Logger.log('info',"LogPuller.cancel()");
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
    Logger.log('info',"create_log_folder() called - trying to create a folder for the logs");
    Logger.log('info',"folder name: " + self.options.log_folder_name);

    let created = false;
    let count = 2;
    while (!created){
      try {
        fs.mkdirSync(self.options.log_folder_name);
        created = true;  //the log folder was created successfully
        if(this.options.controller_logs){
          this.options.controller_log_folder_path = self.options.log_folder_name + "/controller";
          fs.mkdirSync(this.options.controller_log_folder_path);
        }
        if (this.options.solo_logs){
          this.options.solo_log_folder_path = self.options.log_folder_name + "/solo";
          fs.mkdirSync(this.options.solo_log_folder_path);
          fs.mkdirSync(this.options.log_folder_name + "/geodata");
        }
      } catch(err){
        if(err.code != 'EEXIST') {  // We had an erro trying to create the log folder
          Logger.log('info',"Unknown error trying to create log folder - ", err);
          return false
        } else {
          let dirName = self.options.log_folder_name;
          let newDirName = dirName
          if (dirName.endsWith(")")){
            newDirName = dirName.slice(0, dirName.lastIndexOf('('));
          }
          Logger.log('info',`newDirName: ${newDirName}`);
          self.options.log_folder_name = newDirName + ` (${count})`;
          count += 1;
        }
      }
    }
    // success creating the log folders; return true
    return true;
  };

  add_log_notes(cb){
    let versions = this.device.versions;
    let version_strings = [
      "Sololink: " + versions.sololink_version,
      "Gimbal: " + versions.gimbal_version,
      "AccessoryKit: " + versions.ak_version,
      "Shotmanager: " + versions.shotmanager_version,
      "Pixhawk: " + versions.pixhawk_version,
      "Controller: " + versions.controller_version
    ];

    let version_message = "Retrieved: " + helpers.generate_date_string() + "\n\nVersions \n–––––––––\n" + version_strings.join("\n");
    if (this.options.log_notes.length >1){
      version_message += "\n\n Notes\n––––––––\n" + this.options.log_notes;
    }

    fs.writeFile(this.options.log_folder_name + "/Notes.txt", version_message, (err)=>{
      Logger.log('info',this.options.log_folder_name + "/Notes.txt");
      if (err){
        Logger.log('info',"Failed to write notes.txt");
        Logger.log('info',err);
      }
      cb();
    });
  }

  zip_logs_dir(cb){
    //Zip the log files
    if (this.options.create_zip && !this.cancelled){
      Logger.log('info',"zipping logfiles...");
      var zipdir_path = this.options.log_folder_name;  //step up one level from the folder with logs
      Logger.log('info',"zipdir_path - ", zipdir_path);
      var zipdir = "/" + this.options.log_folder_name.split("/")[this.options.log_folder_name.split("/").length - 1];  //get just the timestamp filename
      Logger.log('info',"zipdir - ", zipdir);
      var zipfile = this.options.output_path + zipdir + ".zip";
      Logger.log('info','zipfile - ', zipfile);
      var zipper = Archiver.create('zip', {});

      var out_stream = fs.createWriteStream(zipfile, {flags: 'w'});
      zipper.pipe(out_stream);
      zipper.directory(zipdir_path, zipdir); //put the files in the root of the zipdir
      Logger.log('info',"made it past zipper.directory...");
      out_stream.on('close', ()=>{ //When we call finalize() below, the 'close' event will be emitted.
        Logger.log('info',"zipfile write stream closed");
        cb();
      })
      zipper.finalize();
    } else cb();
  }
  //end of class
};
