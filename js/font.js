// Defined in image.js
// const { ipcRenderer } = require("electron")
const opentype = require('opentype.js');

// Initialization
let fontFilePath = null
let fontFileName = null
let fontDestination = null

function selectFontFile() {
  // Send a message to the main process to open the dialog window for selecting a file
  ipcRenderer.send('selectFontFile', {})
}

function selectFontDestination() {
  // Send a message to the main process to open the dialog window for seleting a folder for destination
  ipcRenderer.send('selectFontDestination', {})
}

ipcRenderer.on("font file path", function(event, data) {
  if(data.canceled == false) {
    //Parse to find the file path selected by the user
    fontFilePath = data.filePaths[0];
    // Split to the find the name of the file selected
    fontFileName = fontFilePath.split('\\')[fontFilePath.split('\\').length-1]
    //Display the file name chosen to the user
    document.getElementById('font-file-name').innerHTML = fontFileName

    // TODO: Remake this for fonts
    // Setting the image for analysis
    //document.getElementById('img-for-analysis').src = fontFilePath
    opentype.load(fontFilePath, function(err, font) {
      if (err) {
          alert('Font could not be loaded: ' + err);
      } else {
        console.log("FONT LOADED")

        console.log(font.glyphs)
        console.log(font.glyphs[5].)

        //Resetting the progress bar
        updateProgressBar(0)
      }
    });



    // TODO: REmake this for fonts
    // Updating the preview
    //setTimeout(() => {updatePreview()}, 1000)
  }
})

ipcRenderer.on("font folder path", function(event, data) {
  if(data.canceled == false) {
    //Parse to find the file path selected by the user
    fontDestination = data.filePaths[0];
    //Display the file name chosen to the user
    document.getElementById('font-destination').innerHTML = fontDestination
  }
})