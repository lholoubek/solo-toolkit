const {remote} = require('electron');
const {Menu, MenuItem} = remote;

const DEVELOP = remote.getGlobal("sharedConfig").dev_env;
console.log("in system menu DEVELOP - " + DEVELOP);

//Menu strings and contents
let about_string = "Solo Toolkit is an application to configure your Solo. Use it to view Solo system information, pull logs, and configure various system settings.";

//Create the template for our main menu_template
let menu_template = [
  {label: "Solo Toolkit",
    submenu: [
      {
        // role: 'about',
        label: "About Solo Toolkit",
        click: ()=>{display_overlay('settings', "About Solo Toolkit", about_string);}
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
  {
    label: "View",
  }
];

let devToolsMenu = [
  {label: "Open developer tools",
  accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    click(item, focusedWindow) {
      if (focusedWindow)
        focusedWindow.webContents.toggleDevTools();
    }
  }
]

if (DEVELOP){
  console.log("Develop flag in menu");
  menu_template[1].submenu = devToolsMenu;
}

let mainMenu = Menu.buildFromTemplate(menu_template);
Menu.setApplicationMenu(mainMenu);
