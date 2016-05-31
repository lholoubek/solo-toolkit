'use strict';
const fs = require('fs');
const EventEmitter = require('events');
const helpers = require('./LogfileHelpers');
const Archiver = require('archiver');
const Path = require('path');

//Export LogPuller as a module
module.exports = class LogPuller extends EventEmitter{
  constructor() {
    super();
    //var self = this;
    console.log("Created new logpuller");
    this.isCancelled = false;
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
      flight_notes:""
    };*/
    this.options = options;
  }

  set_progress_callback(progressCallback){
    //@param {function} progressCallback - function(int)
    //Callback is called as progress is made on a given task
    //Currently used to update the progress bar
    this.progressCallback = progressCallback;
  }

  start_log_pull(){
    //This method does a few things:
    // - Emits event to notify UI that log pulling has started
    // - Calls pull_logs for Solo and/or controller, depending on selected option
    var self = this;

    console.log("start_log_pull");
    console.log('emitting start-pull');
    this.create_log_folder();
    this.emit('start-pull');  //notify UI that the log pull has started

    //TODO - this is very procedural and not very async-y. Update this to take advantage of async and speed it up
    //TODO - Need to modularize this code so we aren't repeating it
    //Pull logs from controller
    if (this.options.controller_logs && !this.isCancelled){ //if the user wants controller logs, call pull_logs() with controller connection
      console.log("Calling pull_logs() for controller");
      var controller_log_folder_path = this.options.log_folder_name + "/controller";
      fs.mkdir(controller_log_folder_path, (err)=>{
        if (err){
          if(err.code == 'EEXIST') {
            console.log("controller log folder already exists.");
          }
        }
        this.pull_logs(solo.controller_connection, controller_log_folder_path);
      });
    }

    //Pull logs from Solo if selected
    if (this.options.solo_logs && !this.isCancelled){
      console.log("Calling pull_logs() for solo");
      var solo_log_folder_path = this.options.log_folder_name + "/solo";
      fs.mkdir(solo_log_folder_path, (err)=>{
        if (err){
          if(err.code == 'EEXIST') {
            console.log("solo log folder already exists.");
          }
        }
        this.pull_logs(solo.solo_connection, solo_log_folder_path);
      });
    }

    //Zip the log files
    if (this.options.create_zip && !this.isCancelled){
      console.log("zipping logfiles...");
      var zipdir_path = Path.dirname(this.options.log_folder_name);  //step up one level from the folder with logs
      console.log("zipdir_path - ", zipdir_path);
      var zipdir = this.options.log_folder_name.split()[this.options.log_folder_name.split().length];  //get just the timestamp filename
      console.log("zipdir - ", zipdir);
      var zipfile = zipdir_path + zipdir + ".zip";
      console.log('zipfile - ', zipfile);
      var zipper = Archiver.create('zip', {});

      var out_stream = fs.createWriteStream(zipfile, {flags: 'w'});
      out_stream.on('close', ()=>{
        console.log("write stream finished..");
      });
      zipper.pipe(out_stream);
      zipper.directory(zipdir_path, '/'); //put the files in the root of the zipdir
    }
  };

  pull_logs(connection, log_folder_path){
    //params: ssh connection object, path
    //using passed connection, sets up sftp connection
    //pulls log files into correct path
    var self = this;

    connection.sftp(function(err, sftp){
      console.log("Trying to connect to pull logs");
      if (err) {
        self.cancel();
        throw err;
      }
      sftp.readdir('/log', (err, list)=>{
        if (err) {
          self.cancel();
          throw err;
        }

        var filtered_list = _.map(list, (val)=>{return val.filename}, self);
        var file_list = _.filter(filtered_list, self.file_list_filter, self);  //need to pass self as context here because file_list_filter accesses options
        var count = 0;
        var length = file_list.length;

        //DEBUGGING
        console.log("Filtered list: " + file_list.toString());
        console.log("Number of files to collect: " + length);
        console.log("Dropping files here: " + log_folder_path);
        //

        async.whilst(
          ()=>{
            if (count < length -1 && !self.isCancelled) {  //if we haven't pulled all the files and the job hasn't been cancelled
              console.log("continuing in the whilst loop...");
              return true;
            } else {
              console.log("breaking whilst loop...");
              return false;
            }
          },
          function(callback){
            count++;
            console.log("Count: " + count);
            var filename = file_list[count];
            console.log("Pulling: " + filename);
            //Pull the next file from filter_list and sftp it over
            sftp.fastGet("/log/" + filename, log_folder_path + "/" + filename, {concurrency:1},function(err){
              if (err) {
                console.log("Something blew up transferring files");
                console.log(err);
                callback(err);
              } else{
                var progress = Math.round(count/length*100);
                console.log("Progress: " + progress);
                self.progressCallback(progress); //update the progress bar on the way through
                callback(null);
              }
            });
          },
          function(err){
            if (err){
              console.log("Logpull complete (final callback called) but with error: ");
              console.log(err);
            } else {
                console.log("logpull completed successfully!");
            }
            self.cancel();
        });
    });
  });
};


  cancel(){
    //Cancels any current logpull operation
    console.log("LogPuller.cancel()");
    this.progressCallback(0);
    this.emit('cancelled');
    this.isCancelled = true;
  };

  file_list_filter(filename){
    var self = this;
    console.log("file_list_filter - ", self, this);
    //Helper method that takes a list of all files in the /log dir on Solo or Artoo and returns array of filenames based on user selected options
    if(helpers.is_logfile(filename)){
      if(self.options.collect_all_logs){
        return true;
      } else if (helpers.log_less_than_max(filename,self.options.num_logs)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  create_log_folder(){
    //Creates a log folder on the local OS for the log files
    console.log("create_log_folder() called - trying to create a folder for the logs");
    console.log("folder name: " + this.options.log_folder_name);
    fs.mkdir(this.options.log_folder_name, (e)=>{
      if(e){
        if(e.code = 'EEXIST'){
          console.log("Log folder already exists...");
        }
      } else {
        return
      };
    });
  };

  zip_logs_dir(){
    //Zips logs dir



  }
  //end of class
};
