const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  
  //variables de entorno para desktop
  //dev
  const indexPath = path.join(__dirname, "dist/browser/index.html");

  //production
  //   const indexPath = path.join(
  //     process.resourcesPath,
  //     "app.asar.unpacked",
  //     "dist",
  //     "browser",
  //     "index.html"
  //   );

  win.loadFile(indexPath);

  // SOLO PARA DEBUG (puedes quitar luego)
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
