//LogfileHelpers module
/*
This module contains functions that help filter lists of logfiles.
This module should be imported and used by the LogPuller class to filter log file names.
*/

function log_name_filter(num, filelist){
  var new_list = [];
  filelist.map((val)=>{
    //If only one '.' in log, we definitely want it (it's the first log)
    if(!val.includes('.', val.indexOf('.') + 1)){
      new_list.push(val);
    } else {
      //Pull the number off the end and compare it
      var sub_val = val.substring(val.lastIndexOf('.') + 1, val.length);
      sub_val = parseInt(sub_val);
      if (!(sub_val > num)){
        new_list.push(val);
      }
    }
  });
  return new_list;
};

function ignore_non_log(filelist){
  var new_list = [];
  filelist.map((val)=>{
    if (val.includes('log')){
      new_list.push(val);
    }
  });
  return new_list;
};

module.exports = {
  log_name_filter: log_name_filter,
  ignore_non_log: ignore_non_log
};
