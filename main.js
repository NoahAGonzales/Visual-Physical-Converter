const { app, BrowserWindow, dialog, ipcMain } = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationWorker: true,
      nodeIntegrationInWorker: true,
    }
  })  

  // and load the index.html of the app.
  win.loadFile('index.html')

  // Open the DevTools.
  win.webContents.openDevTools()

  //Resizing
  var tmpSize = [0,0];

    win.on('resize', (e)=>{
        var size = win.getSize()
        if( Math.abs(size[0]-tmpSize[0]) > 2 || Math.abs(size[1]-tmpSize[1]) > 2){
          win.setSize(size[0], parseInt(size[0] * 9.4 / 16))
        }
      tmpSize = size;
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

/*
  Selecting file
*/

let selectFile = async(event) => {
  //Opening the dialog window for selecting a file - with the filters of an image
  let filePath = await dialog.showOpenDialog({ properties: ['openFile'], filters: [
    {name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'gif']}
  ]})

  // Sending the file path picked back to the render process
  event.sender.send("file path", filePath)
}

ipcMain.on('selectFile', function(event, data) {
  selectFile(event)
})



