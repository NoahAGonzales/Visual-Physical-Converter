// Defined in image.js
// const { ipcRenderer } = require("electron")
const opentype = require('opentype.js');

// Define workers
process.dlopen = () => {
	throw new Error('Load native module is not safe')
}
let fontWorker = new Worker('../workers/fontWorker.js')

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
        console.log(font)


        // TODO: FINISH THIS AND MOVE IT TO THE WORKER
        // For each glyph, generate an object
        let glyphs = font.glyphs.glyphs
        for (let i = 0; i < font.glyphs.length; i++) {
          let points = []
          let glyph = glyphs[i]
          let contourIndex = -1
          let commands = glyph.getPath().commands

        }

        // a
        // TODO: Remove this
        commands = font.glyphs.glyphs[68].getPath().commands
        points = []
        contourIndex = 0
        
        commands.forEach((command, index) => {
          // Move to - start new contour
          if (command.type == 'M') {
            points.push([[command.x, command.y]])
          }
          // Line To
          if (command.type == 'L') {
            points[contourIndex].push([command.x, command.y])
          }
          // Cubic Bezier To
          // Find points - https://stackoverflow.com/questions/5634460/quadratic-b%c3%a9zier-curve-calculate-points
          if (command.type == 'C') {

          }
          // Quadratic Bezier To
          //  Visualization - https://vectorjs.org/examples/svg-path-bezier-quadratic/
          // Find points - https://stackoverflow.com/questions/5634460/quadratic-b%c3%a9zier-curve-calculate-points
          if (command.type == 'Q') {
            
          }
          // Close path
          else if (command.type == 'Z') {
            contourIndex++
          }
        })

        console.log(points)

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