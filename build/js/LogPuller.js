'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fs = require('fs');

//Export LogPuller as a module
module.exports = function (_EventEmitter) {
  _inherits(LogPuller, _EventEmitter);

  function LogPuller() {
    _classCallCheck(this, LogPuller);

    //var self = this;

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(LogPuller).call(this));

    console.log("Created new logpuller");
    _this.isCancelled = false;
    _this.options = {};
    return _this;
  }

  _createClass(LogPuller, [{
    key: 'set_log_options',
    value: function set_log_options(options) {
      this.options = options;
    }
  }, {
    key: 'set_progress_callback',
    value: function set_progress_callback(progressCallback) {
      this.progressCallback = progressCallback;
    }
  }, {
    key: 'start_log_pull',
    value: function start_log_pull() {
      var _this2 = this;

      //This method does a few things:
      // - Emits event to notify UI that log pulling has started
      // - Calls pull_logs for Solo and/or controller, depending on selected option
      var self = this;

      console.log("start_log_pull");

      console.log("Collecting logs!");
      console.log('emitting start-pull');
      this.create_log_folder();
      this.emit('start-pull'); //notify UI that the log pull has started

      //Pull logs from controller
      if (this.options.controller_logs && !this.isCancelled) {
        //if the user wants controller logs, call pull_logs() with controller connection
        console.log("Calling pull_logs() for controller");
        var controller_log_folder_path = this.options.log_folder_name + "/controller";
        fs.mkdir(controller_log_folder_path, function (err) {
          if (!err) {
            _this2.pull_logs(solo.controller_connection, controller_log_folder_path);
          } else {
            console.log("error creating folder to store logs");
            console.log(err);
          }
        });
      }

      //Once complete, pull logs from Solo if selected
      if (this.options.solo_logs && !this.isCancelled) {
        console.log("Calling pull_logs() for solo");
        var solo_log_folder_path = this.options.log_folder_name + "/solo";
        fs.mkdir(this.options.log_folder_name + "/solo", function () {
          _this2.pull_logs(solo.solo_connection, solo_log_folder_path);
        });
      }
    }
  }, {
    key: 'pull_logs',
    value: function pull_logs(connection, log_folder_path) {
      //params: ssh connection object, path
      //using passed connection, sets up sftp connection
      //pulls log files into correct path
      var self = this;

      connection.sftp(function (err, sftp) {
        console.log("Trying to connect to pull logs");
        if (err) {
          self.cancel();
          throw err;
        }
        sftp.readdir('/log', function (err, list) {
          if (err) {
            self.cancel();
            throw err;
          }

          var filtered_list = _.filter(list, self.file_list_filter, self); //need to pass self as context here because file_list_filter accesses options
          var file_list = _.map(filtered_list, function (val) {
            return val.filename;
          }, self);
          var count = 0;
          var length = file_list.length;

          //DEBUGGING
          console.log("Filtered list: " + file_list.toString());
          console.log("Number of files to collect: " + length);
          console.log("Dropping files here: " + log_folder_path);
          //

          async.whilst(function () {
            if (count < length - 1 && !self.isCancelled) {
              //if we haven't pulled all the files and the job hasn't been cancelled
              console.log("continuing in the whilst loop...");
              return true;
            } else {
              console.log("breaking whilst loop...");
              return false;
            }
          }, function (callback) {
            count++;
            console.log("Count: " + count);
            var filename = file_list[count];
            console.log("Pulling: " + filename);
            //Pull the next file from filter_list and sftp it over
            sftp.fastGet("/log/" + filename, log_folder_path + "/" + filename, { concurrency: 1 }, function (err) {
              if (err) {
                console.log("Something blew up transferring files");
                console.log(err);
                callback(err);
              } else {
                var progress = Math.round(count / length * 100);
                console.log("Progress: " + progress);
                self.progressCallback(progress); //update the progress bar on the way through
                callback(null);
              }
            });
          }, function (err) {
            if (err) {
              console.log("Logpull complete (final callback called) but with error: ");
              console.log(err);
            } else {
              console.log("logpull completed successfully!");
            }
            self.cancel();
          });
        });
      });
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      //Cancels any current logpull operation
      console.log("LogPuller.cancel()");
      this.progressCallback(0);
      this.emit('cancelled');
      this.isCancelled = true;
    }
  }, {
    key: 'file_list_filter',
    value: function file_list_filter(filename) {
      //Helper method that takes a list of all files in the /log dir on Solo or Artoo and returns array of filenames based on user selected options
      //General algo here -
      // If it's a directory (which we know if '.' is not in the filename), return false.
      // If we want all logs, return anything with a number in it
      // If we don't want all logs, parse out the int at the end of the file and
      var name = filename.filename;
      if (name.includes('.')) {
        //We have a filename.
        if (this.options.collect_all_logs) {
          return true;
        } else {
          var max_lognum = this.options.num_logs;
          //TODO - IMPLEMENT PARSER TO EXTRACT LOGNAMES AND RETURN ONLY IF < max_lognum
          return true;
        }
      } else {
        return false;
      }
    }
  }, {
    key: 'create_log_folder',
    value: function create_log_folder() {
      //Creates a log folder on the local OS for the log files
      console.log("create_log_folder() called - trying to create a folder for the logs");
      console.log("folder name: " + this.options.log_folder_name);
      fs.mkdir(this.options.log_folder_name, function (e) {
        if (e) {
          console.log(e);
        } else {
          return; //yeah, yeah, I know I'm blocking on this
        };
      });
    }
  }]);

  return LogPuller;
}(EventEmitter);