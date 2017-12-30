//------------------------------------------------------------------------------
// Twitter : @JeffProd
// Web     : https://jeffprod.com
// Mail    : jeffprod - protonmail
// LICENSE : MIT
//------------------------------------------------------------------------------

const electron = require('electron');
const {app, BrowserWindow, ipcMain} = electron;

let mainWindow;

const isAlreadyRunning = app.makeSingleInstance(function() {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
            }
        mainWindow.show();
        }
    });
if (isAlreadyRunning) { app.exit(); }

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        icon: __dirname + '/app/img/icon_app.png'
        });
    mainWindow.loadURL('file://'+__dirname+'/app/index.html');    
    //mainWindow.webContents.openDevTools();
    mainWindow.setMenu(null);
    mainWindow.maximize();
    
    mainWindow.on('closed', function() {
        mainWindow = null;
        app.quit();
        });
    }); // app.on('ready')

ipcMain.on('ipc-quit', function() {
    app.exit();
    });
