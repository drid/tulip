const { contextBridge, ipcRenderer } = require("electron");
const fs = require('fs');
const { dialog } = require('@electron/remote');
const { randomUUID } = require('crypto');

const Sentry = require("@sentry/electron/renderer");

Sentry.init({
    dsn: "https://d5e95e1373931cff30184a1e7d504619@o4508879179284480.ingest.de.sentry.io/4508880154918992",
    integrations: [],
    tracesSampleRate: 1.0,
});

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
    },
    getAppPath: () => ipcRenderer.sendSync("get-app-path"),
    getVersion: () => ipcRenderer.sendSync('get-app-version'),
    randomUUID: () => {
        return randomUUID();
    },
    sendChangelogResult: (result) => ipcRenderer.send('changelog-result', result)
});

contextBridge.exposeInMainWorld("Sentry", {
    captureException: (error) => Sentry.captureException(error),
});
