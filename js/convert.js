const { ipcRenderer } = require("electron")

let filePath = ''
let fileName = ''

function selectFile() {
   // Send a message to the main process open the dialog window for selecting a file
   ipcRenderer.send('selectFile', {})
}

ipcRenderer.on("test", function(event, data) {
  filePath = data.filePaths[0];
  fileName = filePath.split('\\')[filePath.split('\\').length-1]
})