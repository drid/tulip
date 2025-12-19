
const Sentry = require('@sentry/electron/main');
const isDev = require('electron-is-dev');
console.log(isDev ? 'Running in development' : 'Running in production');

if (!isDev) {
  Sentry.init({
    dsn: "https://d5e95e1373931cff30184a1e7d504619@o4508879179284480.ingest.de.sentry.io/4508880154918992",
    debug: true
  });
  Sentry.setUser({ip_address: '0.0.0.0'});
}
process.env.APP_IS_DEV = isDev;

const fs = require('fs');
const fsPromises = require('fs').promises; // For promise-based methods
const { Menu, app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
if (require('electron-squirrel-startup')) app.quit();
const path = require('path');
require('@electron/remote/main').initialize();
const { createChangelogWindow } = require('./src/changelog');
const { createStreetviewWindow } = require('./src/streetview');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var printWindow = null;
var isSaved = true;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
  ipcMain.handle('print-pdf', (event, args) => {
    printPdf(event, args);
  });
  createWindow();
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url); // Open URL in user's browser.
    return { action: "deny" }; // Prevent the app from opening the URL.
  })
  mainWindow.maximize();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {

  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

function createWindow() {
  const template = [
    {
      label: "File",
      submenu: [
        { label: "New", accelerator: "CmdOrCtrl+N", click: function () { mainWindow.webContents.send('new-roadbook'); } },
        { label: "Open", accelerator: "CmdOrCtrl+O", click: function () { mainWindow.webContents.send('open-roadbook'); } },
        { label: "Append", click: function () { mainWindow.webContents.send('append-roadbook'); } },
        { label: "Save", accelerator: "CmdOrCtrl+S", click: function () { mainWindow.webContents.send('save-roadbook'); } },
        { label: "Save As", accelerator: "CmdOrCtrl+Shift+S", click: function () { mainWindow.webContents.send('save-roadbook-as'); } },
        { label: "Import GPX", accelerator: "CmdOrCtrl+I", click: function () { mainWindow.webContents.send('import-gpx'); } },
        {
          label: "Export",
          submenu: [
            { label: "Export GPX", accelerator: "CmdOrCtrl+E", click: function () { mainWindow.webContents.send('export-gpx'); } },
            { label: "Export OpenRally GPX", click: function () { mainWindow.webContents.send('export-openrally-gpx'); } },
            { label: "Export PDF", accelerator: "CmdOrCtrl+P", click: function () { mainWindow.webContents.send('export-pdf'); } },
          ]
        },
        { label: "Quit", accelerator: "CmdOrCtrl+Q", click: function () { app.quit(); } },
      ]
    },
    {
      label: "Edit",
      submenu: [
        // { label: "Undo Text", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        // { label: "Redo Text", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        // { type: "separator" },
        // { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        // { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        // { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        // { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
        { label: "Bring to front", click: function () { mainWindow.webContents.send('bring-to-front'); } },
        { label: "Send to back", click: function () { mainWindow.webContents.send('send-to-back'); } },
        { type: "separator" },
        {
          label: "Tracks",
          submenu: [
            { label: "Add Track 360", accelerator: "CmdOrCtrl+1", click: function () { mainWindow.webContents.send('add-track-0'); } },
            { label: "Add Track 45", accelerator: "CmdOrCtrl+2", click: function () { mainWindow.webContents.send('add-track-45'); } },
            { label: "Add Track 90", accelerator: "CmdOrCtrl+3", click: function () { mainWindow.webContents.send('add-track-90'); } },
            { label: "Add Track 135", accelerator: "CmdOrCtrl+4", click: function () { mainWindow.webContents.send('add-track-135'); } },
            { label: "Add Track 180", accelerator: "CmdOrCtrl+5", click: function () { mainWindow.webContents.send('add-track-180'); } },
            { label: "Add Track 225", accelerator: "CmdOrCtrl+6", click: function () { mainWindow.webContents.send('add-track-225'); } },
            { label: "Add Track 270", accelerator: "CmdOrCtrl+7", click: function () { mainWindow.webContents.send('add-track-270'); } },
            { label: "Add Track 315", accelerator: "CmdOrCtrl+8", click: function () { mainWindow.webContents.send('add-track-315'); } },
            { type: "separator" },
            { label: "Set Track HP", accelerator: "CmdOrCtrl+Option+1", click: function () { mainWindow.webContents.send('set-track-lvt'); } },
            { label: "Set Track HP", accelerator: "CmdOrCtrl+Option+1", click: function () { mainWindow.webContents.send('set-track-hp'); } },
            { label: "Set Track P", accelerator: "CmdOrCtrl+Option+2", click: function () { mainWindow.webContents.send('set-track-p'); } },
            { label: "Set Track PP", accelerator: "CmdOrCtrl+Option+3", click: function () { mainWindow.webContents.send('set-track-pp'); } },
            { label: "Set Track RO", accelerator: "CmdOrCtrl+Option+4", click: function () { mainWindow.webContents.send('set-track-ro'); } },
            { label: "Set Track DCW", accelerator: "CmdOrCtrl+Option+5", click: function () { mainWindow.webContents.send('set-track-dcw'); } },
          ]
        },
        { type: "separator" },
        { label: "Add Glyph", accelerator: "CmdOrCtrl+Option+G", click: function () { mainWindow.webContents.send('add-glyph'); } },
        { label: "Fill zone speed limit", click: function () { mainWindow.webContents.send('fill-zone-speed-limit'); } },
        { label: "Roadbook logo", accelerator: "", click: function () { mainWindow.webContents.send('add-roadbook-logo'); } },
        { label: "Settings", click: function () { mainWindow.webContents.send('open-settings'); } },
      ]
    },
    {
      label: "View",
      submenu: [
        ...(isDev ?
        [
          { label: "Reload", accelerator: "CmdOrCtrl+R", click: function () { mainWindow.webContents.send('reload-roadbook'); } },
          { type: "separator" }
        ] : []
        ),
        { label: "Toggle Roadbook", accelerator: "CmdOrCtrl+B", click: function () { mainWindow.webContents.send('toggle-roadbook'); } },
        { type: "separator" },
        { label: "Zoom in", accelerator: "CmdOrCtrl+Plus", click: function () { mainWindow.webContents.send('zoom-in'); } },
        { label: "Zoom out", accelerator: "CmdOrCtrl+-", click: function () { mainWindow.webContents.send('zoom-out'); } },
        { label: "Instruction Street View", click: openStreetviewWindow },
        { type: "separator" },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: function () {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            focusedWindow.webContents.toggleDevTools();
          }
        },
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Changelog", click: function () {
            mainWindow.webContents.send('open-changelog');
          }
        },
        { label: "User Manual (online)", click: async () => {
          try {
            await shell.openExternal('https://drid.gitlab.io/tulip');
          } catch (err) {
            console.error('Failed to open URL:', err);
          }
        }  },
        { label: "About", click: function () { mainWindow.webContents.send('show-about-info'); } },
      ]
    }

  ];

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu);

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    'min-height': 700,
    'title': 'Tulip ' + app.getVersion(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,
      contextIsolation: true,
      enableRemoteModule: true,
      nodeIntegration: false
    }
  });

  require('@electron/remote/main').enable(mainWindow.webContents);

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.webContents.load

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    printWindow = null;
  });
  mainWindow.on('close', (event) => {
    if (!isSaved) {
      const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['Save', 'Cancel', 'Don’t Save'],
        defaultId: 1, // Default to 'Cancel'
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Do you want to save them before closing?',
        detail: 'If you don’t save, your changes will be lost.',
      });

      switch (response) {
        case 0: // Save
          mainWindow.webContents.send('save-roadbook');
          event.preventDefault();
          break;
        case 1: // Cancel
          event.preventDefault();
          break;
        case 2: // Don’t Save
          break;
      }
    }
  });
}


/*
  IPC LISTENERS
  TODO: the below should go in their own folders and be required
*/
var data;
var settings;

ipcMain.on('ignite-print', (event, arg, appSettings) => {
  printWindow = new BrowserWindow({
    width: 650,
    height: 700,
    'min-height': 700,
    'resizable': true,
    parent: mainWindow, // Set the main window as the parent
    modal: true, // Makes the print window modal
    alwaysOnTop: true, // Ensures the print window stays on top
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
      sandbox: false
    }
  });

  printWindow.setMenu(null);

  require('@electron/remote/main').enable(printWindow.webContents);


  printWindow.loadURL('file://' + __dirname + '/print.html');

  data = arg;
  settings = appSettings;
  printWindow.on('closed', () => {
    printWindow = null
  })

});

//listens for the browser window to say it's ready to print
ipcMain.on('print-launched', (event) => {
  event.sender.send('print-data', data, settings);
});

ipcMain.on('check-file-existence', (event, fileName) => {
  if (fs.existsSync(fileName)) {
    event.reply('file-exists', fileName);
  } else {
    event.reply('file-does-not-exist', fileName);
  }
});

// NOTE this is about as robust as a wet paper bag and fails just as gracefully
function printPdf(event, arg) {
  var size = (arg.opts.pageSize == 'A5' ? 'A5' : 'Roll');
  var filename = arg.filepath.replace('.tlp', '-' + size + '.pdf')

  printWindow.webContents.printToPDF(arg.opts)
    .then(async (data) => {
      try {
        await fsPromises.writeFile(filename, data);
        printWindow.close();
        await dialog.showMessageBox(mainWindow, { title: 'Roadbook PDF Saved', type: 'info', message: "Your PDF has been exported to:\n" + filename, buttons: ['OK'] })
      } catch (error) {
        console.error('Error writing to PDF file:', error.message);
        printWindow.close();
        // Handle specific errors if needed
        if (error.code === 'ENOENT') {
          console.error('The specified directory does not exist.');
          await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'PDF export error',
            message: 'The specified directory does not exist',
            buttons: ['OK']
          });
        } else if (error.code === 'EACCES') {
          console.error('Permission denied when writing to the file.');
          mainWindow.focus();
          await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'PDF export error',
            message: 'Permission denied when writing to the file',
            buttons: ['OK']
          })
        } else {
          console.error('PDF export error.');
          await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'PDF export error',
            message: error.message,
            buttons: ['OK']
          });
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

async function openStreetviewWindow() {
  await createStreetviewWindow(mainWindow);
}

//listens for the browser window to ask for the documents folder
ipcMain.on('get-documents-path', (event) => {
  event.sender.send('documents-path', app.getPath('documents'));
});

ipcMain.on("get-app-path", (event) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on("get-app-version", (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on('toggle-dev-tools', (event) => {
  mainWindow.toggleDevTools();
})

ipcMain.on('open-dev-tools', (event) => {
  mainWindow.openDevTools();
})

ipcMain.on('open-changelog', async () => {
  const result = await createChangelogWindow(mainWindow);
  mainWindow.webContents.send('changelog-result', result);
});

ipcMain.on('update-saved-state', (event, data) => {
  isSaved = data;
})

ipcMain.handle('get-is-dev', () => isDev);

ipcMain.on('get-user-glyphs', (event, glyphPath) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
      .map(e => e.toLowerCase());

    const results = [];

    function scan(currentPath) {
      const files = fs.readdirSync(currentPath);

      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!file.startsWith('.') && file !== 'node_modules') {
            scan(fullPath);
            continue;
          }
        } else {
          const ext = path.extname(file).toLowerCase();
          if (imageExtensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    }

    scan(path.resolve(glyphPath));
    event.sender.send('user-glyphs', results);
})