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
let worker = new Worker('../workers/convertor.js')

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

function convertFile() {
  let scale = parseFloat(document.getElementById('scale-text-input').value)
  let height = parseFloat(document.getElementById('height-text-input').value)
  let baseHeight = parseFloat(document.getElementById('base-height-text-input').value)
  let smoothN = parseFloat(document.getElementById('smoothing-text-input').value)

  //Ensuring that there are no empty inputs
  let emptyFields = [false, false, false, false]
  if(document.getElementById('scale-text-input').value.length == 0) {
    document.getElementById('scale-error').innerHTML = 'Scale'
    emptyFields[0] = true
  }
  if(document.getElementById('height-text-input').value.length == 0) {
    //Adding commas
    let text = ''
    if(emptyFields[0])
      text += ', '

    text += 'Height'
    document.getElementById('height-error').innerHTML = text
    emptyFields[1] = true
  }
  if(document.getElementById('base-height-text-input').value.length == 0) {
    //Adding commas
    let text = ''
    if(emptyFields[0] || emptyFields[1])
      text += ', '
      
    text += 'Base Height'
    document.getElementById('base-height-error').innerHTML = text
    emptyFields[2] = true
  }
  if(document.getElementById('smoothing-text-input').value.length == 0) {
    //Adding commas
    let text = ''
    if(emptyFields[0] || emptyFields[1] || emptyFields[2])
      text += ', '
      
    text += 'Smoothing'
    document.getElementById('smoothing-error').innerHTML = text
    emptyFields[3] = true
  }

  if(emptyFields[0] || emptyFields[1] || emptyFields[2] || emptyFields[3]) {
    document.getElementById("error-box").style='opacity: 100%'
    return
  }
  

	// Not converting if there is no file selected
	if(filePath != null) {
    //Disabling text boxes
    document.getElementById('scale-text-input').disabled = true
    document.getElementById('height-text-input').disabled = true
    document.getElementById('base-height-text-input').disabled = true
    document.getElementById('smoothing-text-input').disabled = true
    document.getElementById('select-file-button').disabled = true

		// The mat for image analysis
		let src = cv.imread('img-for-analysis', cv.IMREAD_GRAYSCALE)
		// Variable to hold the pixel values of the image
		let pixelValues = [...Array(src.rows)].map(e => Array(src.cols).fill(null))
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
		worker.postMessage([filePath, fileName, pixelValues, scale, height, baseHeight, smoothN])
	}
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

