const { ipcRenderer } = require("electron")

/********************************************************************************************************************************
  Initialization
*/
document.getElementById("invert-radio-input-black").checked = true

/********************************************************************************************************************************
  Workers
*/
process.dlopen = () => {
	throw new Error('Load native module is not safe')
}
let worker = new Worker('../workers/converter.js')

/********************************************************************************************************************************
 * Selecting the file
 */

let filePath = null
let fileName = null

function selectFile() {
   // Send a message to the main process open the dialog window for selecting a file
   ipcRenderer.send('selectFile', {})
}

ipcRenderer.on("file path", function(event, data) {
  if(data.canceled == false) {
    //Parse to find the file path selected by the user
    filePath = data.filePaths[0];
    // Split to the find the name of the file selected
    fileName = filePath.split('\\')[filePath.split('\\').length-1]
    //Display the file name chosen to the user
    document.getElementById('filename').innerHTML=fileName
    // Setting the image for analysis
    document.getElementById('img-for-analysis').src = filePath
    //Resetting the progress bar
    updateProgressBar(0)
  }
})

/********************************************************************************************************************************
 * Converting
 */

function generatePixelValues() {
  console.log('generating pixel values')

  // Ensuring that an image has been selected
  if (filePath == null) {
    return
  }

  // The mat for image analysis
  src = cv.imread('img-for-analysis', cv.IMREAD_GRAYSCALE)
  // Variable to hold the pixel values of the image
  pixelValues = [...Array(src.rows)].map(e => Array(src.cols).fill(null))
  //Storing the values of the pixels in the array
  if(document.getElementById("invert-radio-input-black").checked == true) {
    for(let i = 0; i < src.rows; i++) {
      for (let j = 0; j < src.cols; j++) {
        pixelValues[i][j] = src.ucharAt(i, j * src.channels())
      }
    }
  }
  else {
    for(let i = 0; i < src.rows; i++) {
      for (let j = 0; j < src.cols; j++) {
        pixelValues[i][j] = 255-src.ucharAt(i, j * src.channels())
      }
    }
  }
}

function convertFile() {
  // Pulling settings
  let scale = parseFloat(document.getElementById('scale-text-input').value)
  let height = parseFloat(document.getElementById('height-text-input').value)
  let baseHeight = parseFloat(document.getElementById('base-height-text-input').value)
  let smoothN = parseFloat(document.getElementById('smoothing-text-input').value)

  //Ensuring that there are no errors
  if(document.getElementById('scale-error').innerHTML.length != 0 
    || document.getElementById('scale-error').innerHTML.length != 0 
    || document.getElementById('scale-error').innerHTML.length != 0 
    || document.getElementById('scale-error').innerHTML.length != 0
    || filePath == null) {
    return
  }
	
  //Disabling text boxes
  document.getElementById('scale-text-input').disabled = true
  document.getElementById('height-text-input').disabled = true
  document.getElementById('base-height-text-input').disabled = true
  document.getElementById('smoothing-text-input').disabled = true
  document.getElementById('select-file-button').disabled = true

  generatePixelValues()
  
  worker.postMessage([filePath, fileName, pixelValues, scale, height, baseHeight, smoothN])
}

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
  progressBar.style.setProperty('--width', newWidth * 100)
}

/**
 * Listens to the convertor worker for updates on the progress of conversion
 */
worker.onmessage = function (e) {
  updateProgressBar(e.data[0])

  // Enable other functions
  if(e.data.length > 1) {
    document.getElementById('select-file-button').disabled = false
    document.getElementById('scale-text-input').disabled = false
    document.getElementById('height-text-input').disabled = false
    document.getElementById('base-height-text-input').disabled = false
    document.getElementById('smoothing-text-input').disabled = false
  }
}

