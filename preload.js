const { contextBridge, ipcRenderer } = require("electron");
const fs = require('fs');
const { dialog } = require('@electron/remote');

contextBridge.exposeInMainWorld("globalNode", {
    dialog: () => {
        return dialog;
    },
    printToPdf: (data) => {
        return ipcRenderer.invoke('print-pdf', data);
    },
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
    }
});