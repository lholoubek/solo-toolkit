'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const dialog = electron.dialog;
var client = require('electron-connect').client;
const ipcMain = require('electron').ipcMain;
const globalShortcut = require('electron').globalShortcut;
//const remote = electron.remote;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  };
});

//print out that we've received the reboot command
ipcMain.on('reboot-command', function(event, command) {
  event.sender.send('reboot-reply', 'Acking the reboot command');
});

ipcMain.on('open-dir-dialog', function(event, arg) {
    var dirPath = dialog.showOpenDialog(mainWindow, { properties: [ 'openDirectory', 'multiSelections' ]})
    event.sender.send('open-dir-dialog-reply', dirPath);
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {

  //Set basic window options
  var window_options = {
    "minWidth": 770,
    "minHeight": 450,
  };

  // Create the browser window.
  mainWindow = new BrowserWindow(window_options);

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  client.create(mainWindow);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  //Create a keyboard shortcut to open the dev tools
  globalShortcut.register('Command+D+T', ()=>{
    if (mainWindow.isFocused()){
      console.log("Shortcut pressed. Opening DevTools...");
      mainWindow.webContents.openDevTools();
    };
  });


  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});
