//LogfileHelpers module
/*
This module contains functions that help filter lists of logfiles.
This module should be imported and used by the LogPuller class to filter log file names.
*/

const async = require('async');

function log_less_than_max(filename, max){
  //@param {String} filename – Valid logfile name.
  //@param {int} max – optional maximum lognum that's acceptable. Reject if log exceeds max
  //@return {bool} – True if this logfile is less than max
  //If only one '.' in log, we definitely want it (it's the first log)
  if (max){
    if(!filename.includes('.', filename.indexOf('.') + 1)){
      return true;
    } else {
      //Pull the number off the end and compare it
      var log_num = filename.substring(filename.lastIndexOf('.') + 1, filename.length);
      log_num = parseInt(log_num);
      if (!(log_num> max)){
        return true;
      }
    };
    return false;
  } else {
    return true;
  }
}

function is_logfile(name){
    //@param {String} name – filename
    //@return {bool} -
    //If the file is a logfile, return true. If not (like if it's a dir), return false
      if (name.includes('log') && name.indexOf('.') > 0){
        return true;
      } else {
        return false;
      };
}

function fileListFromDirList(dirList, collect_all_logs, num_logs, collecting_geodata){
    var filtered_list = dirList.map((val)=>{return val.filename});
    console.log(filtered_list);
    var file_list = filtered_list.filter((filename)=>{
      if(is_logfile(filename)||collecting_geodata){
        if(collect_all_logs){
          return true;
        } else if (log_less_than_max(filename,num_logs)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
    return file_list;
}

function asyncFilePull(sftp, file_list, base_path, out_path, isCancelled, progress, callback){

  let count = 0;
  let length = file_list.length;

  async.whilst(
    ()=>{  //test
      return (count < length && !isCancelled());
    },
   (async_cb)=>{  // if test passed.
     let filename = file_list[count];
     count++;
     sftp.fastGet(base_path + `/${filename}`, out_path + `/${filename}`, {concurrency:1}, (err)=>{
       if (err) async_cb(err); // call the final function with an error
       else {
         let percentage = Math.round(count/length*100);
         progress(percentage);
         async_cb(null);
       }
     });
    },
    (err)=>{ // if err we'll get an error; otherwise completed
      if (err){
        console.log("Logpull complete (final callback called) but with error: ");
        console.log(err);
      } else {
        console.log("completed logpull successfully");
        progress(0);
        callback();
      }
    });
}

function generate_date_string(){
    // Returns date string to use for log folders and such
    var date = new Date();
    return date.getFullYear() + "_" + (date.getMonth() + 1).toString() + "_" + date.getDate();
}

module.exports = {
  log_less_than_max: log_less_than_max,
  is_logfile: is_logfile,
  fileListFromDirList: fileListFromDirList,
  asyncFilePull: asyncFilePull,
  generate_date_string: generate_date_string
}

if (require.main === module){
  console.log(is_logfile('shotlog.5'));
  console.log(log_less_than_max('shotlog.log.2',3));
};
