const { ipcRenderer } = require("electron")

// Define workers
process.dlopen = () => {
	throw new Error('Load native module is not safe')
}
let worker = new Worker('../workers/converter.js')

// Initialization
document.getElementById("invert-radio-input-black").checked = true
let imageFilePath = null
let imageFileName = null
let imageDestination = null


function selectImageFile() {
   // Send a message to the main process to open the dialog window for selecting a file
   ipcRenderer.send('selectImageFile', {})
}

function selectImageDestination() {
  // Send a message to the main process to open the dialog window for seleting a folder for destination
  ipcRenderer.send('selectImageDestination', {})
}

ipcRenderer.on("image file path", function(event, data) {
  if(data.canceled == false) {
    //Parse to find the file path selected by the user
    imageFilePath = data.filePaths[0];
    // Split to the find the name of the file selected
    imageFileName = imageFilePath.split('\\')[imageFilePath.split('\\').length-1]
    //Display the file name chosen to the user
    document.getElementById('image-file-name').innerHTML=imageFileName
    // Setting the image for analysis
    document.getElementById('img-for-analysis').src = imageFilePath
    //Resetting the progress bar
    updateProgressBar(0)
    // Updating the preview
    setTimeout(() => {updatePreview()}, 1000)
  }
})

ipcRenderer.on("image folder path", function(event, data) {
  if(data.canceled == false) {
    //Parse to find the file path selected by the user
    imageDestination = data.filePaths[0];
    //Display the file name chosen to the user
    document.getElementById('image-destination').innerHTML= imageDestination
  }
})

// ********************************************************************************************************************************
// Converting

function generatePixelValues() {
  // Ensuring that an image has been selected
  if (imageFilePath == null) {
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
  if(document.getElementById('scale-error').innerHTML.length != 0 ||
    document.getElementById('scale-error').innerHTML.length != 0 ||
    document.getElementById('scale-error').innerHTML.length != 0 ||
    document.getElementById('scale-error').innerHTML.length != 0 ||
    imageFilePath == null) {
    return
  }
	
  //Disabling text boxes
  document.getElementById('scale-text-input').disabled = true
  document.getElementById('height-text-input').disabled = true
  document.getElementById('base-height-text-input').disabled = true
  document.getElementById('smoothing-text-input').disabled = true
  document.getElementById('select-file-button').disabled = true
  document.getElementById('select-destination-button').disabled = true

  generatePixelValues()
  
  worker.postMessage([imageFilePath, imageFileName, pixelValues, scale, height, baseHeight, smoothN, imageDestination])
}

// ********************************************************************************************************************************
// Progress bar

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
    document.getElementById('smoothing-destination-input').disabled = false
  }
}

// ********************************************************************************************************************************
// Tabs

// TODO: Move this to somewhere common between image and font
function openTab(evt, name) {
  let i, tabContent, tabLinks

  // Get all elements with class tab-content and hide them
  tabContent = document.getElementsByClassName("tab-content");
  for (i = 0; i < tabContent.length; i++) {
    tabContent[i].style.display = "none"
  }

  // Get all elements with class="tab-link" and remove the class "active"
  tabLinks = document.getElementsByClassName("tab-link")
  for (i = 0; i < tabLinks.length; i++) {
    tabLinks[i].className = tabLinks[i].className.replace(" active", "")
  }

  // Show the current tab, and add an active class to the button that opened the tab
  document.getElementById(name).style.display = "flex"
  evt.currentTarget.className += " active"
}

