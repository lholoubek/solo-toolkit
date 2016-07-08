// Builds Electron for Mac
const packager = require('electron-packager');
const package = require('../package.json');

// BUILD OPTIONS––––––––––
const VERSION = package.version;
// –––––––––––––––––––––––

let mac_options = {
  dir: ".",
  platform: "darwin",
  arch: "x64",
  "app-version": VERSION,
  "build-version": VERSION,
  icon: "./build/assets/icon/solo_toolkit.icns",
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
  icon: "./build/assets/icon/solo_toolkit.icns",
  ignore: "node_modules/(babel-preset-es2015|node-sass|babel-*|gulp|gulp-*|electron-packager)",
  name: "Solo Toolkit",
  out: "./dist"
}

process.env.ELECTRON_DEVELOP = "true";
console.log(`Building version ${VERSION} for Mac and Linux`);

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
