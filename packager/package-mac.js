const packager = require('electron-packager');

// BUILD OPTIONS
const VERSION = "0.1.2";

let options = {
  dir: ".",
  platform: "darwin",
  arch: "x64",
  "app-version": VERSION,
  "build-version": VERSION,
  icon: "./build/assets/icon/solo_toolkit.icns",
  ignore: "node_modules/(babel-preset-es2015|node-sass|babel-*|gulp|gulp-*|electron-packager)",
  name: "Solo Toolkit",
}

process.env.ELECTRON_DEVELOP = "false";
console.log(`Building version ${VERSION} for Mac...`);
console.log("Dev mode set: " + process.env.ELECTRON_DEVELOP);
packager(options, (err)=>{
  if (err) console.log(err);
  console.log("Completed Mac packaging.");
});
