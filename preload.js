const { contextBridge, ipcRenderer, webContents } = require("electron");
const fs = require('fs');
const {dialog} = require('@electron/remote');

contextBridge.exposeInMainWorld("globalNode", {
    // remote: () => remote,
    // remote: (lambda) => {
    //     console.log(remote);
    //     return lambda(remote);
    // },
    dialog: () => {
        return dialog;
    },
    printToPdf: (data) => {
        return ipcRenderer.invoke('print-pdf', data);
    },
    // fs: () => fs,

    // fs: {
    //     ...fs,
    //     readdirSync: fs.readdirSync.bind(readdirSync)
    // },

    fs: {
        ...fs,
        readdirSync: (dir) => {
            return fs.readdirSync(dir);
        },
        readFile: fs.readFile.bind(fs)
    },

    ipcRenderer: {
        ...ipcRenderer,
        on: ipcRenderer.on.bind(ipcRenderer),
        send: ipcRenderer.send.bind(ipcRenderer),
        removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
    },

    // We can also expose variables, not just functions
});

// contextBridge.exposeInMainWorld("globalFs", {
//     readdirSync: (dirname) => fs.readdirSync(dirname)
// });