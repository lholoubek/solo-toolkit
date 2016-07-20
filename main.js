'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const dialog = electron.dialog;
var client = require('electron-connect').client;
const ipcMain = require('electron').ipcMain;
const globalShortcut = require('electron').globalShortcut;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;

// Pull environment coniguration
const ENV = require('./app/.env.json');

const DEVELOP = (ENV.dev);
const VERSION = app.getVersion();

//Create a global object accessible in the renderer process (via remote.getGlobal())
global.env = {dev:DEVELOP,
              version:VERSION,
              auto_reload: ENV.auto_reload,
              packaged: ENV.packaged
              };

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  };
});

ipcMain.on('open-dir-dialog', function(event, arg) {
    var dirPath = dialog.showOpenDialog(mainWindow, { properties: [ 'openDirectory', 'multiSelections' ]})
    event.sender.send('open-dir-dialog-reply', dirPath);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  createMainWindow();
});

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

app.on('activate', function () {
  // Create a new window when the window has been closed but the user clicks on the dock icon
  if (mainWindow === null) {
    createMainWindow()
  }
})

function createMainWindow(){
  // Creates a browser window
  //Set basic window options
  let window_options = {
    "minWidth": 770,
    "minHeight": 450,
    width:800,
    height: 650,
    // frame: false,
    // titleBarStyle: 'hidden'
  };

  // Create the browser window.
  mainWindow = new BrowserWindow(window_options);

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  if (ENV.auto_reload) client.create(mainWindow, {sendBounds: true});

  // Open the DevTools.
  if (DEVELOP) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}
