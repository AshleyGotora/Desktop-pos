const { app, BrowserWindow } = require('electron');

function CreateWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadURL('http://localhost:5173');
}
app.whenReady().then(CreateWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});