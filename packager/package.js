// Builds Electron for Mac
const packager = require('electron-packager');
const package = require('../package.json');
const ENV = require('../app/.env.json');

// BUILD OPTIONS––––––––––
const VERSION = package.version;
// –––––––––––––––––––––––

let mac_options = {
  dir: ".",
  platform: "darwin",
  arch: "x64",
  "app-version": VERSION,
  "build-version": VERSION,
  icon: "./app/assets/icon/solo_toolkit.icns",
  ignore: "node_modules/(babel-preset-es2015|node-sass|babel-*|gulp|gulp-*|electron-packager)",
  name: "Solo Toolkit",
  out: "./dist"
}

let linux_options = {
  dir: ".",
  platform: "linux",
  arch: "x64",
  "app-version": VERSION,
  "build-version": VERSION,
  icon: "./app/assets/icon/solo_toolkit.icns",
  ignore: "node_modules/(babel-preset-es2015|node-sass|babel-*|gulp|gulp-*|electron-packager)",
  name: "Solo Toolkit",
  out: "./dist"
}

console.log(`Building version ${VERSION} for Mac and Linux`);
console.log("Building in debug: " + ENV.dev_env);

// Build for Mac
packager(mac_options, (err)=>{
  if (err) console.log(err);
  console.log("Completed Mac packaging.");
});
// Build for Linux
packager(linux_options, (err)=>{
  if (err) console.log(err);
  console.log("Completed Linux packaging.");

});
