'use strict';
const fs = require('fs');

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
    this.options = options;
  }
  set_progress_callback(progressCallback){
    this.progressCallback = progressCallback;
  }

  start_log_pull(){
    //This method does a few things:
    // - Emits event to notify UI that log pulling has started
    // - Calls pull_logs for Solo and/or controller, depending on selected option
    var self = this;

    console.log("start_log_pull");

    console.log("Collecting logs!");
    console.log('emitting start-pull');
    this.create_log_folder();
    this.emit('start-pull');  //notify UI that the log pull has started


    //Pull logs from controller
    if (this.options.controller_logs && !this.isCancelled){ //if the user wants controller logs, call pull_logs() with controller connection
      console.log("Calling pull_logs() for controller");
      var controller_log_folder_path = this.options.log_folder_name + "/controller";
      fs.mkdir(controller_log_folder_path, (err)=>{
        if(!err){
          this.pull_logs(solo.controller_connection, controller_log_folder_path);
        } else {
          console.log("error creating folder to store logs");
          console.log(err);
        }
      });
    }

    //Once complete, pull logs from Solo if selected
    if (this.options.solo_logs && !this.isCancelled){
      console.log("Calling pull_logs() for solo");
      var solo_log_folder_path = this.options.log_folder_name + "/solo";
      fs.mkdir(this.options.log_folder_name + "/solo", ()=>{
        this.pull_logs(solo.solo_connection, solo_log_folder_path);
      });
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

        var filtered_list = _.filter(list, self.file_list_filter, self);  //need to pass self as context here because file_list_filter accesses options
        var file_list = _.map(filtered_list, (val)=>{return val.filename}, self);
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
    //Helper method that takes a list of all files in the /log dir on Solo or Artoo and returns array of filenames based on user selected options
    //General algo here -
    // If it's a directory (which we know if '.' is not in the filename), return false.
    // If we want all logs, return anything with a number in it
    // If we don't want all logs, parse out the int at the end of the file and
    var name = filename.filename;
    if (name.includes('.')){
      //We have a filename.
      if (this.options.collect_all_logs){
        return true;
      } else {
        var max_lognum = this.options.num_logs;
        //TODO - IMPLEMENT PARSER TO EXTRACT LOGNAMES AND RETURN ONLY IF < max_lognum
        return true;
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
        console.log(e);
      } else {
        return //yeah, yeah, I know I'm blocking on this
      };
    });
  };
  //end of class
};
