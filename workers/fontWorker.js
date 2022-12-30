
let userFontSize = 0
let userFontThickness = 0
let userFontCurveDef = 0

/**
 * All messages to this worker will be for converting something. The message will consist of an array with the following elements in this order:
 *    0) The file path of the selected font
 *    1) The file name of the selected font (can be determined from the file path, but has already been computed)
 *    2) Destination
 *    3) Point cloud
 *    4) Font Size
 *    5) Character Thickness
 *    6) Font Curve Definition
 */
onmessage = function (e) {
  //Creating the write stream
  let stream = fs.createWriteStream(e.data[2] + '\\' + e.data[1].split('.')[0] + '.stl', {flags: 'w'})

  //Setup
  userFontSize = e.data[3]
  userFontThickness = e.data[4]
  userFontCurveDef = e.data[5]

  //Process

  //Convert
  convertFont(stream)

  //Cleaning up
  stream.end()
  // TODO: How does this affect image processing?
  postMessage([100, false])

  //self.close()
}

function convertFont(stream) {

}