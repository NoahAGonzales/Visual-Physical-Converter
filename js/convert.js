const { ipcRenderer } = require("electron")
const cv = require('../js/opencv')
const fs = require ('fs')


/********************************************************************************************************************************
 * Selecting the file
 */

let filePath = null
let fileName = null

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
  // Setting the image for analysis
  document.getElementById('img-for-analysis').src = filePath
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
  progressBar.style.setProperty('--width', newWidth * 100)
}


/********************************************************************************************************************************
 * Convert
 */

/**
 * Writes the generic beginning of a facet to the given stream
 * @param {fs write stream} stream 
 */
function writeFacetBeginning (stream) {
  stream.write("facet normal 0 0 0" + "\n" + "outer loop" + "\n")
}

/**
 * Writes the generic beginning of a caet to the given stream
 * @param {fs write stream} stream 
 */
function writeFacetEnd (stream) {
  stream.write("endloop" + "\n" + "endfacet" + "\n")
}

/**
 * Coverts the already selected file to an stl file
 */
function convert() {
  // Not converting if there is no file selected
  if(filePath == null) {
    return
  }
  

  // Making the mat
  let src = cv.imread('img-for-analysis', cv.IMREAD_GRAYSCALE)

  // Variable to hold the pixel values of the image
  let pixelValues = [...Array(src.rows)].map(e => Array(src.cols).fill(null))
  //Storing the values of the pixels in the array
  for(let i = 0; i < src.rows; i++) {
    for (let j = 0; j < src.cols; j++) {
      pixelValues[i][j] = parseInt(src.ucharAt(i, j * src.channels()))
    }
  }

  // Creating the read stream
  let stream = fs.createWriteStream(fileName.split('.')[0] + '.stl', {flags: 'w'})

  // Settings
  let scale = 1/255
  
  // Status
  let maxProgress = (src.rows * src.cols)  // Every pixel + initial triangles for sides
  let currentProgress = 0

  stream.write("solid pic" + "\n")

	/*
	* Iterating through every other pixel to generate the facets of the top face
	*
	*                * -- * -- *
	*                |  \ | /  |
	*                * -- * -- *
	*                |  / | \  |
	*                * -- * -- *
	*
	*/

	for (let row = 1; row < src.rows; row+=2)
	{
		for (let col = 1; col < src.cols; col+=2)
		{
			/*
			*
			* Creating facets w/ clockwise vertexes
			*
			* facet normal n1 n2 n3
			*   outer loop
			*     vertex x y z
			* 	  vertex x y z
			* 	  vertex x y z
			*   "\n"oop
			* endfacets
			*/

			/* Top-Left
				*--*
				 \ |
				   *
			*/
			writeFacetBeginning(stream);
		  stream.write("vertex " + row + " " + col + " " + pixelValues[row][col] * scale + "\n")
			stream.write("vertex " + (row-1) + " " + col + " " + pixelValues[(row-1)][col] * scale + "\n")
			stream.write("vertex " + (row-1) + " " +(col-1)+ " " + pixelValues[row-1][col-1] * scale + "\n")
			writeFacetEnd(stream);

			/* Top-Left
				*
				| \
				*--*
			*/
			writeFacetBeginning(stream);
			stream.write("vertex " + row + " " + col + " " + pixelValues[row][col] * scale + "\n")
			stream.write("vertex " + (row-1) + " " +(col-1)+ " " + pixelValues[(row-1)][col - 1] * scale + "\n")
			stream.write("vertex " + row + " " +(col-1)+ " " + pixelValues[row][col-1] * scale + "\n")
			writeFacetEnd(stream);

			/* Top-Right
				*--*
				| /
				*
			*/
			if (col+1 < src.cols) //Is this pixel not on the last column
			{
				writeFacetBeginning(stream);
				stream.write("vertex " + row + " " + col + " " + pixelValues[row][col] * scale + "\n")
				stream.write("vertex " + (row-1) + " " +(col+1)+ " " + pixelValues[(row-1)][col + 1] * scale + "\n")
				stream.write("vertex " + (row-1) + " " + col + " " + pixelValues[(row-1)][col] * scale + "\n")
				writeFacetEnd(stream);

				/* Top-Right
					   *
					 / |
					*--*
				*/
				writeFacetBeginning(stream);
				stream.write("vertex " + row + " " + col + " " + pixelValues[row][col] * scale + "\n")
				stream.write("vertex " + row + " " +(col+1)+ " " + pixelValues[row][col + 1] * scale + "\n")
				stream.write("vertex " + (row-1) + " " +(col+1)+ " " + pixelValues[(row-1)][col + 1] * scale + "\n")
				writeFacetEnd(stream);
			}

			if (row + 1 < src.rows) //Is this pixel not on the last row?
			{
				/* Bottom-Left
					   *
					 / |
					*--*
				*/
				writeFacetBeginning(stream);
				stream.write("vertex " + row + " " + col + " " + pixelValues[row][col] * scale + "\n")
				stream.write("vertex " +(row+1)+ " " +(col-1)+ " " + pixelValues[row + 1][col - 1] * scale + "\n")
				stream.write("vertex " +(row+1)+ " " + col + " " + pixelValues[row + 1][col] * scale + "\n")
				writeFacetEnd(stream);

				/* Bottom-Left
					*--*
					| /
					*
				*/
				writeFacetBeginning(stream);
				stream.write("vertex " + row + " " + col + " " + pixelValues[row][col] * scale + "\n")
				stream.write("vertex " + row + " " +(col-1)+ " " + pixelValues[row][col - 1] * scale + "\n")
				stream.write("vertex " +(row+1)+ " " +(col-1)+ " " + pixelValues[row + 1][col - 1] * scale + "\n")
				writeFacetEnd(stream);
			}

			if (row + 1 < src.rows &&(col+1)< src.cols)
			{
				/* Bottom-Right
					*
					| \
					*--*
				*/
				writeFacetBeginning(stream);
				stream.write("vertex " + row + " " + col + " " + pixelValues[row][col] * scale + "\n")
				stream.write("vertex " +(row+1)+ " " + col + " " + pixelValues[row + 1][col] * scale + "\n")
				stream.write("vertex " +(row+1)+ " " +(col+1)+ " " + pixelValues[row + 1][col + 1] * scale + "\n")
				writeFacetEnd(stream);

				/* Bottom-Right
					*--*
					 \ |
					   *
				*/
				writeFacetBeginning(stream);
				stream.write("vertex " + row + " " + col + " " + pixelValues[row][col] * scale + "\n")
				stream.write("vertex " +(row+1)+ " " +(col+1)+ " " + pixelValues[row + 1][col + 1] * scale + "\n")
				stream.write("vertex " + row + " " +(col+1)+ " " + pixelValues[row][col + 1] * scale + "\n")
				writeFacetEnd(stream);
			}

			currentProgress += 4
			updateProgressBar(currentProgress/maxProgress)
		}
	}

	/*
	* Creating initial triangles for corners (side and bottom) if need be to avoid condition checking for each pixel along the edge
	*/
	let centerX = ((src.cols-1)) / 2.0;
	let centerY = ((src.rows-1)) / 2.0;

	//Top-left corner
	if (pixelValues[0][0] != 0)
	{
		/*
		* Sides
		*/

		//Left edge going across rows
		writeFacetBeginning(stream);
		stream.write("vertex " + 0 + " " + 0 + " " + pixelValues[0][0] * scale + "\n")
		stream.write("vertex " + 0 + " " + 0 + " " + 0 + "\n")
		stream.write("vertex " + 1 + " " + 0 + " " + 0 + "\n")
		writeFacetEnd(stream);

		//Top edge going across columns
		writeFacetBeginning(stream);
		stream.write("vertex " + 0 + " " + 0 + " " + pixelValues[0][0] * scale + "\n")
		stream.write("vertex " + 0 + " " + 1 + " " + 0 + "\n")
		stream.write("vertex " + 0 + " " + 0 + " " + 0 + "\n")
		writeFacetEnd(stream);

		/*
		* Bottom
		*/

		//Left edge going across rows
		writeFacetBeginning(stream);
		stream.write("vertex " + 0 + " " + 0 + " " + 0 + "\n")
		stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
		stream.write("vertex " + 1 + " " + 0 + " " + 0 + "\n")
		writeFacetEnd(stream);

		//Top edge going across columns
		writeFacetBeginning(stream);
		stream.write("vertex " + 0 + " " + 0 + " " + 0 + "\n")
		stream.write("vertex " + 0 + " " + 1 + " " + 0 + "\n")
		stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
		writeFacetEnd(stream);
	}
	
	//Bottom-Left corner
	if (pixelValues[(src.rows-1)][0] != 0)
	{
		/*
		* Sides
		*/

		//Left edge going across rows
		writeFacetBeginning(stream);
		stream.write("vertex " + (src.rows-1) + " " + 0 + " " + pixelValues[(src.rows-1)][0] * scale + "\n")
		stream.write("vertex " + (src.rows - 2) + " " + 0 + " " + pixelValues[(src.rows-1)][0] * scale + "\n")
		stream.write("vertex " + (src.rows-1) + " " + 0 + " " + 0 + "\n")
		writeFacetEnd(stream);

		//Bottom edge going across columns
		writeFacetBeginning(stream);
		stream.write("vertex " + (src.rows-1) + " " + 0 + " " + pixelValues[(src.rows-1)][0] * scale + "\n")
		stream.write("vertex " + (src.rows-1) + " " + 0 + " " + 0 + "\n")
		stream.write("vertex " + (src.rows-1) + " " + 1 + " " + 0 + "\n")
		writeFacetEnd(stream);

		/*
		* Bottom
		*/

		//Bottom edge going across columns
		writeFacetBeginning(stream);
		stream.write("vertex " + (src.rows-1) + " " + 0 + " " + 0 + "\n")
		stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
		stream.write("vertex " + (src.rows-1) + " " + 1 + " " + 0 + "\n")
		writeFacetEnd(stream);
	}
	
	//Top-right corner
	if (pixelValues[0][(src.cols-1)] != 0)
	{
		/*
		* Sides
		*/

		//Top edge going across columns
		writeFacetBeginning(stream);
		stream.write("vertex " + 0 + " " + (src.cols-1) + " " + pixelValues[0][(src.cols-1)] * scale + "\n")
		stream.write("vertex " + 0 + " " + (src.cols-1) + " " + 0 + "\n")
		stream.write("vertex " + 0 + " " + (src.cols-2) + " " + pixelValues[0][src.cols-2] * scale + "\n")
		writeFacetEnd(stream);
		
		//Right edge going across rows
		writeFacetBeginning(stream);
		stream.write("vertex " + 0 + " " + (src.cols-1) + " " + pixelValues[0][(src.cols-1)] * scale + "\n")
		stream.write("vertex " + 1 + " " + (src.cols-1) + " " + 0 + "\n")
		stream.write("vertex " + 0 + " " + (src.cols-1) + " " + 0 + "\n")
		writeFacetEnd(stream);
		
		/*
		* Bottom
		*/

		//Right edge going across rows
		writeFacetBeginning(stream);
		stream.write("vertex " + 0 + " " + (src.cols-1) + " " + 0 + "\n")
		stream.write("vertex " + 1 + " " + (src.cols-1) + " " + 0 + "\n")
		stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
		writeFacetEnd(stream);
	}
	//Bottom-right corner
	if (pixelValues[(src.rows-1)][(src.cols-1)] != 0)
	{
		/*
		* Sides
		*/

		//Right edge going across rows
		writeFacetBeginning(stream);
		stream.write("vertex " + (src.rows-1) + " " + (src.cols-1) + " " + pixelValues[(src.rows-1)][(src.cols-1)] * scale + "\n")
		stream.write("vertex " + (src.rows-1) + " " + (src.cols-1) + " " + 0 + "\n")
		stream.write("vertex " + (src.rows-2) + " " + (src.cols-1) + " " + pixelValues[src.rows-2][(src.cols-1)] * scale+ "\n")
		writeFacetEnd(stream);

		//Bottom edge going across columns
		writeFacetBeginning(stream);
		stream.write("vertex " + (src.rows-1) + " " + (src.cols-1) + " " + pixelValues[(src.rows-1)][(src.cols-1)] * scale + "\n")
		stream.write("vertex " + (src.rows-1) + " " + (src.cols-2) + " " + pixelValues[(src.rows-1)][src.cols - 2] * scale + "\n")
		stream.write("vertex " + (src.rows-1) + " " + (src.cols-1) + " " + 0 + "\n")
		writeFacetEnd(stream);
	}


	//Creating the base. Every pixel along the edge except the first and last will be used to create 2 facets. Facet 1 consits of the point, the point changed to a value of zero, and the last point. Facet 2 consists of the point, the next point changed to a value of zero, and the point changed to a value of 0;
	for (let row = 1; row < (src.rows-1); row++)
	{
		//Left edge
		if (pixelValues[row][0] != 0)
		{
			/*
			* Sides
			*/
			writeFacetBeginning(stream);
			stream.write("vertex " + row + " " + 0 + " " + pixelValues[row][0] * scale + "\n")
			stream.write("vertex " + (row-1) + " " + 0 + " " + pixelValues[(row-1)][0] * scale + "\n")
			stream.write("vertex " + row + " " + 0 + " " + 0 + "\n")
			writeFacetEnd(stream);

			writeFacetBeginning(stream);
			stream.write("vertex " + row + " " + 0 + " " + pixelValues[row][0] * scale + "\n")
			stream.write("vertex " + row + " " + 0 + " " + 0 + "\n")
			stream.write("vertex " + (row+1) + " " + 0 + " " + 0 + "\n")
			writeFacetEnd(stream);

			/*
			* Bottom
			*/
			writeFacetBeginning(stream);
			stream.write("vertex " + row + " " + 0 + " " + 0 + "\n")
			stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
			stream.write("vertex " + (row+1) + " " + 0 + " " + 0 + "\n")
			writeFacetEnd(stream);
		}
		//Right edge
		if (pixelValues[row][(src.cols-1)] != 0)
		{
			/*
			* Sides
			*/
			writeFacetBeginning(stream);
			stream.write("vertex " + row + " " + (src.cols-1) + " " + pixelValues[row][(src.cols-1)] * scale + "\n")
			stream.write("vertex " + row + " " + (src.cols-1) + " " + 0 + "\n")
			stream.write("vertex " + (row-1) + " " + (src.cols-1) + " " + pixelValues[row-1][(src.cols-1)] * scale + "\n")
			writeFacetEnd(stream);

			writeFacetBeginning(stream);
			stream.write("vertex " + row + " " + (src.cols-1) + " " + pixelValues[row][(src.cols-1)] * scale + "\n")
			stream.write("vertex " + (row+1) + " " + (src.cols-1) + " " + 0 + "\n")
			stream.write("vertex " + row + " " + (src.cols-1) + " " + 0 + "\n")
			writeFacetEnd(stream);

			/*
			* Bottom
			*/
			writeFacetBeginning(stream);
			stream.write("vertex " + row + " " + (src.cols-1) + " " + 0 + "\n")
			stream.write("vertex " +(row+1)+ " " + (src.cols-1) + " " + 0 + "\n")
			stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
			writeFacetEnd(stream);
		}
	}
	for (let col = 1; col < (src.cols-1); col++)
	{
		//Top edge
		if (pixelValues[0][col] != 0)
		{
			/*
			* Sides
			*/
			writeFacetBeginning(stream);
			stream.write("vertex " + 0 + " " + col + " " + pixelValues[0][col] * scale + "\n")
			stream.write("vertex " + 0 + " " + col + " " + 0 + "\n")
			stream.write("vertex " + 0 + " " +(col-1)+ " " + pixelValues[0][col-1] * scale + "\n")
			writeFacetEnd(stream);

			writeFacetBeginning(stream);
			stream.write("vertex " + 0 + " " + col + " " + pixelValues[0][col] * scale + "\n")
			stream.write("vertex " + 0 + " " +(col+1)+ " " + 0 + "\n")
			stream.write("vertex " + 0 + " " + col + " " + 0 + "\n")
			writeFacetEnd(stream);

			/*
			* Bottom
			*/
			writeFacetBeginning(stream);
			stream.write("vertex " + 0 + " " + col + " " + 0 + "\n")
			stream.write("vertex " + 0 + " " +(col+1)+ " " + 0 + "\n")
			stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
			writeFacetEnd(stream);
		}
		//Bottom edge
		if (pixelValues[(src.rows-1)][col] != 0)
		{
			/*
			* Sides
			*/
			writeFacetBeginning(stream);
			stream.write("vertex " + (src.rows-1) + " " + col + " " + pixelValues[(src.rows-1)][col] * scale + "\n")
			stream.write("vertex " + (src.rows-1) + " " +(col-1)+ " " + pixelValues[(src.rows-1)][col - 1] * scale + "\n")
			stream.write("vertex " + (src.rows-1) + " " + col + " " + 0 + "\n")
			writeFacetEnd(stream);

			writeFacetBeginning(stream);
			stream.write("vertex " + (src.rows-1) + " " + col + " " + pixelValues[(src.rows-1)][col] * scale + "\n")
			stream.write("vertex " + (src.rows-1) + " " + col + " " + 0 + "\n")
			stream.write("vertex " + (src.rows-1) + " " +(col+1)+ " " + 0 + "\n")
			writeFacetEnd(stream);

			/*
			* Bottom
			*/
			writeFacetBeginning(stream);
			stream.write("vertex " + (src.rows-1) + " " + col + " " + 0 + "\n")
			stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
			stream.write("vertex " + (src.rows-1) + " " +(col+1)+ " " + 0 + "\n")
			writeFacetEnd(stream);
		}
	}

  stream.write("endsolid pic" + "\n")

}

