const {remote} = require('electron');
const {Menu, MenuItem} = remote;

const DEVELOP = remote.getGlobal("env").dev;
const VERSION = remote.getGlobal("env").version;
console.log("in system menu DEVELOP - " + DEVELOP);
console.log("in system menu VERSION - " + VERSION);

//Menu strings and contents
let version_string = "v" + VERSION;
if (DEVELOP) version_string += "-dev"; // Version string is displayed as the version when the user clicks 'About' from the app menu
version_string += "\n\n\n";
let about_string = "Solo Toolkit is an application to configure your Solo. Use it to view Solo system information, pull logs, and configure various system settings.";

//Create the template for our main menu_template
let menu_template = [
  {label: "Solo Toolkit",
    submenu: [
      {
        // role: 'about',
        label: "About Solo Toolkit",
        click: ()=>{display_overlay('settings', version_string, about_string);}
      },
      {
        type: 'separator'
      },
      // {
      //   role: 'services',
      //   submenu: []
      // },
      {
        type: 'separator'
      },
      {
        role: 'hide',
        label: "Hide Solo Toolkit"
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      },
    ]
  },
  { label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
  },
  { label: "View",
    submenu: [
      {label: "System info", accelerator: "CmdOrCtrl+1", click: view_system_info},
      {label: "Log collection", accelerator: "CmdOrCtrl+2", click: load_log_collection},
      {label: "System settings", accelerator:"CmdOrCtrl+3", click: load_settings}
    ]
  }
];

let devToolsMenu = {label: "Open developer tools",
  accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    click(item, focusedWindow) {
      if (focusedWindow)
        focusedWindow.webContents.toggleDevTools();
    }
  }


if (DEVELOP){
  menu_template[2].submenu.push({type:"separator"});
  menu_template[2].submenu.push(devToolsMenu);
}

let mainMenu = Menu.buildFromTemplate(menu_template);
Menu.setApplicationMenu(mainMenu);
