// src/main/main.js
const { app, BrowserWindow, session } = require("electron");
//const { autoUpdater } = require("electron-updater");
const { createMainWindow } = require("./windows");
require("./ipcHandlers"); // load all IPC event registrations
//asd
// Initialize auto-updater events and periodic update checks.
function initAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for update...");
  });
  autoUpdater.on("update-not-available", (info) => {
    console.log("No update available:", info);
  });
  autoUpdater.on("update-available", () => {
    console.log("Update available, downloading...");
  });
  autoUpdater.on("update-downloaded", (info) => {
    // Optionally prompt the user to restart the app
    console.log("Update downloaded:", info);
  });
  autoUpdater.on("error", (err) => {
    console.log("Auto-updater error:", err);
  });
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 3600000); // Check every hour
}

// Create the initial login window.
function createApp() {
  //initAutoUpdater();
  createMainWindow();
}

app.whenReady().then(createApp);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle macOS dock re-activation
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoginWindow();
  }
});

// (Optional) Remove X-Frame-Options headers if needed.
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      if (
        details.responseHeaders["x-frame-options"] ||
        details.responseHeaders["X-Frame-Options"]
      ) {
        delete details.responseHeaders["x-frame-options"];
        delete details.responseHeaders["X-Frame-Options"];
      }
      callback({ cancel: false, responseHeaders: details.responseHeaders });
    });
    createMainWindow();
  }
});
