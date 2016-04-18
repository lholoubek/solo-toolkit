var Client = require('ssh2').Client;

var conn = new Client();
conn.on('ready', function(er) {
  if(er){
    console.log("Error connecting");
  } else {
      console.log('Client :: ready');
      get_artoo_version(conn);
  }
});

conn.on('error', function(er){
  console.log("Error occurred");
  console.log(er);
});

conn.connect({
    host: '10.1.1.1',
    port: 22,
    username: 'root',
    password: 'TjSDBkAu',
    readyTimeout: 2000
  });

function get_artoo_version(conn){
  var artooVersion = '';
  conn.sftp(function(err, sftp) {
    if (err) throw err;
    var file = sftp.createReadStream('/VERSION');
    var data = '';
    file.on('readable', function() {
      while ((chunk=file.read()) != null) {
          data += chunk;
      }
    });
    file.on('end', function() {
      artooVersion = data.split("\n")[0].trim();
      console.log(artooVersion);
    });
  });

};
