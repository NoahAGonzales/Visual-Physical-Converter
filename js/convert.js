const { ipcRenderer } = require("electron")

/********************************************************************************************************************************
 * Selecting the file
 */

let filePath = ''
let fileName = ''

function selectFile() {
   // Send a message to the main process open the dialog window for selecting a file
   ipcRenderer.send('selectFile', {})
}

ipcRenderer.on("test", function(event, data) {
  //Parse to find the file path selected by the user
  filePath = data.filePaths[0];
  // Split to the find the name of the file selected
  fileName = filePath.split('\\')[filePath.split('\\').length-1]
  //Display the file name chosen to the user
  document.getElementById('filename').innerHTML=fileName
})

/********************************************************************************************************************************
 * Progress bar
 */
const progressBar = document.getElementById('progress-bar')

/**
 * Returns the current width of the progress bar
 */
function getProgressBarWidth() {
  const computedStyle = getComputedStyle(progressBar)
  const width = parseFloat(computedStyle.getPropertyValue('--width')) || 0
  return width
}

/**
 * Update the progress bar with the given value
 * @param {number} newWidth - A positive number meant to be the new percent of the progress bar
 */
function updateProgressBar (newWidth) {
  progressBar.style.setProperty('--width', newWidth)
}


/********************************************************************************************************************************
 * Convert
 */

