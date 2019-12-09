const fs = require ('fs')
const cv = require('../js/opencv')

let pixelValues = null

/**
 * All messages to this worker will be to convert something. Of which the message will consist of an array with the following elements in this order:
 *    0) The file path of the selected image
 *    1) The file name of the selected image (can be determined from the file path, but has already been computed)
 */
onmessage = function (e) {
   //Creating the write stream
   let stream = fs.createWriteStream(e.data[1].split('.')[0] + '.stl', {flags: 'w'})

   //Setup
   pixelValues = e.data[2]

   //Process
   smooth(1)

   //Convert
   convert(stream)

   //Cleaning up
   stream.end()
   self.close()
}

/**
 * Smooths the pixel value heights in the pixelValues array
 * Uses n passes of a 3-point rectangular smooth
 */
function smooth(n) {
   // Pass n times
   for(let passes = 0; passes < n; passes++) {
      // Smoothing the values with the pixel values on all adjacent sides
      for(let row = 1; row < pixelValues.length-1; row++) {
         for(let col = 1; col < pixelValues[0].length-1; col++) {
            pixelValues[row][col] = (pixelValues[row-1][col] + pixelValues[row][col] + pixelValues[row+1][col] + pixelValues[row][col-1] + pixelValues[row][col+1])/5
         }
      }
   }
}


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
 function convert(stream) {
   // Settings
   let baseHeight = 1
   let scale = 2

   //Adjustments
   let height = 1/255 * 1
   let xScale = 1 / ((pixelValues.length-1 > pixelValues[0].length-1) ? (pixelValues.length-1) : (pixelValues[0].length-1)) * scale //Scale based on the larger of the dimensions
   let yScale = 1 / ((pixelValues.length-1 > pixelValues[0].length-1) ? (pixelValues.length-1) : (pixelValues[0].length-1)) * scale //Scale based on the larger of the dimensions
   
   // Status
   let currentProgress = 0
   let maxProgress = (pixelValues.length * pixelValues[0].length) + (6*pixelValues.length + 6*pixelValues[0].length - 12) // Every pixel + sides + base = (length*width) + (4*length-4 + 4*width-4) + (2*length-2 + 2*width-2)
   //Adjusting maxProgress for values of 0
   for (let row = 1; row < (pixelValues.length-1); row++) {
      //Left edge
      if (pixelValues[row][0] == 0)
         maxProgress -= 3
      //Right edge
      if (pixelValues[row][(pixelValues[0].length-1)] == 0)
         maxProgress -= 3
   }
   for (let col = 1; col < (pixelValues[0].length-1); col++) {
      if (pixelValues[0][col] == 0) 
         maxProgress -= 3
      if (pixelValues[(pixelValues.length-1)][col] == 0)
         maxProgress -= 3
   }

 
   /*
      Conversion
   */
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
 
   for (let row = 1; row < pixelValues.length; row+=2)
   {
      for (let col = 1; col < pixelValues[0].length; col+=2)
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
         *   loop
         * endfacets
         */

         /* Top-Left
            *--*
             \ |
               *
         */
         writeFacetBeginning(stream)
         stream.write("vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n")
         stream.write("vertex " + (row-1)*xScale + " " + col*yScale + " " + (pixelValues[(row-1)][col] * height + baseHeight) + "\n")
         stream.write("vertex " + (row-1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[row-1][col-1] * height + baseHeight) + "\n")
         writeFacetEnd(stream)
 
         /* Top-Left
            *
            | \
            *--*
         */
         writeFacetBeginning(stream)
         stream.write("vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n")
         stream.write("vertex " + (row-1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[(row-1)][col - 1] * height + baseHeight) + "\n")
         stream.write("vertex " + row*xScale + " " + (col-1)*yScale + " " + (pixelValues[row][col-1] * height + baseHeight) + "\n")
         writeFacetEnd(stream)

         postMessage([(++currentProgress)/maxProgress])
 
         /* Top-Right
            *--*
            | /
            *
         */
         if (col+1 < pixelValues[0].length) //Is this pixel not on the last column
         {
            writeFacetBeginning(stream)
            stream.write("vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n")
            stream.write("vertex " + (row-1)*xScale + " " + (col+1)*yScale + " " + (pixelValues[(row-1)][col + 1] * height + baseHeight) + "\n")
            stream.write("vertex " + (row-1)*xScale + " " + col*yScale + " " + (pixelValues[(row-1)][col] * height + baseHeight) + "\n")
            writeFacetEnd(stream)
 
            /* Top-Right
                  *
                / |
               *--*
            */
            writeFacetBeginning(stream)
            stream.write("vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n")
            stream.write("vertex " + row*xScale + " " + (col+1)*yScale + " " + (pixelValues[row][col + 1] * height + baseHeight) + "\n")
            stream.write("vertex " + (row-1)*xScale + " " + (col+1)*yScale + " " + (pixelValues[(row-1)][col + 1] * height + baseHeight) + "\n")
            writeFacetEnd(stream)
         }

         postMessage([(++currentProgress)/maxProgress])
 
         if (row + 1 < pixelValues.length) //Is this pixel not on the last row?
         {
            /* Bottom-Left
                  *
                / |
               *--*
            */
            writeFacetBeginning(stream)
            stream.write("vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n")
            stream.write("vertex " + (row+1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[row + 1][col - 1] * height + baseHeight) + "\n")
            stream.write("vertex " + (row+1)*xScale + " " + col*yScale + " " + (pixelValues[row + 1][col] * height + baseHeight) + "\n")
            writeFacetEnd(stream)
 
            /* Bottom-Left
               *--*
               | /
               *
            */
            writeFacetBeginning(stream)
            stream.write("vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n")
            stream.write("vertex " + row*xScale + " " + (col-1)*yScale + " " + (pixelValues[row][col - 1] * height + baseHeight) + "\n")
            stream.write("vertex " + (row+1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[row + 1][col - 1] * height + baseHeight) + "\n")
            writeFacetEnd(stream)
         }

         postMessage([(++currentProgress)/maxProgress])
 
         if (row + 1 < pixelValues.length &&(col+1)< pixelValues[0].length)
         {
            /* Bottom-Right
               *
               | \
               *--*
            */
            writeFacetBeginning(stream)
            stream.write("vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n")
            stream.write("vertex " + (row+1)*xScale + " " + col*yScale + " " + (pixelValues[row + 1][col] * height + baseHeight) + "\n")
            stream.write("vertex " + (row+1)*xScale + " " + (col+1)*yScale + " " + (pixelValues[row + 1][col + 1] * height + baseHeight) + "\n")
            writeFacetEnd(stream)
 
            /* Bottom-Right
               *--*
                \ |
                  *
            */
            writeFacetBeginning(stream)
            stream.write("vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n")
            stream.write("vertex " + (row+1)*xScale + " " + (col+1)*yScale + " " + (pixelValues[row + 1][col + 1] * height + baseHeight) + "\n")
            stream.write("vertex " + row*xScale + " " + (col+1)*yScale + " " + (pixelValues[row][col + 1] * height + baseHeight) + "\n")
            writeFacetEnd(stream)
         }
 
         postMessage([(++currentProgress)/maxProgress])
      }
   }
 
   /*
   * Creating initial triangles for corners (side and bottom) if need be to avoid condition checking for each pixel along the edge
   */
   let centerX = ((pixelValues.length-1))*xScale / 2.0;
   let centerY = ((pixelValues[0].length-1))*yScale / 2.0;
 
   //Top-left corner
   //if (pixelValues[0][0] != 0)
   //{
      //Sides
      
      //Left edge going across rows
      writeFacetBeginning(stream)
      stream.write("vertex " + 0 + " " + 0 + " " + (pixelValues[0][0] * height + baseHeight) + "\n")
      stream.write("vertex " + 0 + " " + 0 + " " + 0 + "\n")
      stream.write("vertex " + 1*xScale + " " + 0 + " " + 0 + "\n")
      writeFacetEnd(stream)
 
      //Top edge going across columns
      writeFacetBeginning(stream)
      stream.write("vertex " + 0 + " " + 0 + " " + (pixelValues[0][0] * height + baseHeight) + "\n")
      stream.write("vertex " + 0 + " " + 1*yScale + " " + 0 + "\n")
      stream.write("vertex " + 0 + " " + 0 + " " + 0 + "\n")
      writeFacetEnd(stream)
 
      
      //Bottom

      //Left edge going across rows
      
      writeFacetBeginning(stream)
      stream.write("vertex " + 0 + " " + 0 + " " + 0 + "\n")
      stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
      stream.write("vertex " + 1*xScale + " " + 0 + " " + 0 + "\n")
      writeFacetEnd(stream)
      
 
      //Top edge going across columns
      
      writeFacetBeginning(stream)
      stream.write("vertex " + 0 + " " + 0 + " " + 0 + "\n")
      stream.write("vertex " + 0 + " " + 1*yScale + " " + 0 + "\n")
      stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
      writeFacetEnd(stream)
   //}
   
   //Bottom-Left corner
   //if (pixelValues[(pixelValues.length-1)][0] != 0)
   //{
      //Sides
       
      //Left edge going across rows
      writeFacetBeginning(stream)
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + (pixelValues[(pixelValues.length-1)][0] * height + baseHeight) + "\n")
      stream.write("vertex " + (pixelValues.length - 2)*xScale + " " + 0 + " " + (pixelValues[(pixelValues.length-1)][0] * height + baseHeight) + "\n")
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + 0 + "\n")
      writeFacetEnd(stream)
 
      //Bottom edge going across columns
      writeFacetBeginning(stream)
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + (pixelValues[(pixelValues.length-1)][0] * height + baseHeight) + "\n")
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + 0 + "\n")
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + 1*yScale + " " + 0 + "\n")
      writeFacetEnd(stream)
 
      
      //Bottom
 
      //Bottom edge going across columns
      writeFacetBeginning(stream)
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + 0 + "\n")
      stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + 1*yScale + " " + 0 + "\n")
      writeFacetEnd(stream)
   //}
    
   //Top-right corner
   //if (pixelValues[0][(pixelValues[0].length-1)] != 0)
   //{
      
      //Sides
 
      //Top edge going across columns
      writeFacetBeginning(stream)
      stream.write("vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[0][(pixelValues[0].length-1)] * height + baseHeight) + "\n")
      stream.write("vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
      stream.write("vertex " + 0 + " " + (pixelValues[0].length-2)*yScale + " " + (pixelValues[0][pixelValues[0].length-2] * height + baseHeight) + "\n")
      writeFacetEnd(stream)
       
      //Right edge going across rows
      writeFacetBeginning(stream)
      stream.write("vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[0][(pixelValues[0].length-1)] * height + baseHeight) + "\n")
      stream.write("vertex " + 1*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
      stream.write("vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
      writeFacetEnd(stream)
       
      
      //Bottom
 
      //Right edge going across rows
      writeFacetBeginning(stream)
      stream.write("vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
      stream.write("vertex " + 1*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
      stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
      writeFacetEnd(stream)
   //}

   //Bottom-right corner
   //if (pixelValues[(pixelValues.length-1)][(pixelValues[0].length-1)] != 0)
   //{
      //Sides
      
      //Right edge going across rows
      writeFacetBeginning(stream)
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[(pixelValues.length-1)][(pixelValues[0].length-1)] * height + baseHeight) + "\n")
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
      stream.write("vertex " + (pixelValues.length-2)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[pixelValues.length-2][(pixelValues[0].length-1)] * height + baseHeight) + "\n")
      writeFacetEnd(stream)
 
      //Bottom edge going across columns
      writeFacetBeginning(stream)
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[(pixelValues.length-1)][(pixelValues[0].length-1)] * height + baseHeight) + "\n")
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-2)*yScale + " " + (pixelValues[(pixelValues.length-1)][pixelValues[0].length - 2] * height + baseHeight) + "\n")
      stream.write("vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
      writeFacetEnd(stream)
   //}
   

    //Creating the base. Every pixel along the edge except the first and last will be used to create 2 facets. Facet 1 consits of the point, the point changed to a value of zero, and the last point. Facet 2 consists of the point, the next point changed to a value of zero, and the point changed to a value of 0;
   for (let row = 1; row < (pixelValues.length-1); row++)
   {
      //Left edge
      //if (pixelValues[row][0] != 0)
      //{   
         //Sides
      
         writeFacetBeginning(stream)
         stream.write("vertex " + row*xScale + " " + 0 + " " + (pixelValues[row][0] * height + baseHeight) + "\n")
         stream.write("vertex " + (row-1)*xScale + " " + 0 + " " + (pixelValues[(row-1)][0] * height + baseHeight) + "\n")
         stream.write("vertex " + row*xScale + " " + 0 + " " + 0 + "\n")
         writeFacetEnd(stream)
 
         writeFacetBeginning(stream)
         stream.write("vertex " + row*xScale + " " + 0 + " " + (pixelValues[row][0] * height + baseHeight) + "\n")
         stream.write("vertex " + row*xScale + " " + 0 + " " + 0 + "\n")
         stream.write("vertex " + (row+1)*xScale + " " + 0 + " " + 0 + "\n")
         writeFacetEnd(stream)
 
         
         //Bottom
         
         writeFacetBeginning(stream)
         stream.write("vertex " + row*xScale + " " + 0 + " " + 0 + "\n")
         stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
         stream.write("vertex " + (row+1)*xScale + " " + 0 + " " + 0 + "\n")
         writeFacetEnd(stream)

         currentProgress += 3
         postMessage([(currentProgress)/maxProgress])
      //}
      //Right edge
      //if (pixelValues[row][(pixelValues[0].length-1)] != 0)
      //{
         //Sides
         
         writeFacetBeginning(stream)
         stream.write("vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[row][(pixelValues[0].length-1)] * height + baseHeight) + "\n")
         stream.write("vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
         stream.write("vertex " + (row-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[row-1][(pixelValues[0].length-1)] * height + baseHeight) + "\n")
         writeFacetEnd(stream)
 
         writeFacetBeginning(stream)
         stream.write("vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[row][(pixelValues[0].length-1)] * height + baseHeight) + "\n")
         stream.write("vertex " + (row+1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
         stream.write("vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
         writeFacetEnd(stream)
 
         //Bottom
         
         writeFacetBeginning(stream)
         stream.write("vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
         stream.write("vertex " + (row+1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n")
         stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
         writeFacetEnd(stream)

         
         currentProgress += 3
         postMessage([(currentProgress)/maxProgress])
      //}
    }
   for (let col = 1; col < (pixelValues[0].length-1); col++)
   {
      //Top edge
      //if (pixelValues[0][col] != 0)
      //{
         
         //Sides
         
         writeFacetBeginning(stream)
         stream.write("vertex " + 0 + " " + col*yScale + " " + (pixelValues[0][col] * height + baseHeight) + "\n")
         stream.write("vertex " + 0 + " " + col*yScale + " " + 0 + "\n")
         stream.write("vertex " + 0 + " " + (col-1)*yScale + " " + (pixelValues[0][col-1] * height + baseHeight) + "\n")
         writeFacetEnd(stream)
 
         writeFacetBeginning(stream)
         stream.write("vertex " + 0 + " " + col*yScale + " " + (pixelValues[0][col] * height + baseHeight) + "\n")
         stream.write("vertex " + 0 + " " + (col+1)*yScale + " " + 0 + "\n")
         stream.write("vertex " + 0 + " " + col*yScale + " " + 0 + "\n")
         writeFacetEnd(stream)
 
         // Bottom
         
         writeFacetBeginning(stream)
         stream.write("vertex " + 0 + " " + col*yScale + " " + 0 + "\n")
         stream.write("vertex " + 0 + " " + (col+1)*yScale + " " + 0 + "\n")
         stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
         writeFacetEnd(stream)

         
         currentProgress += 3
         postMessage([(currentProgress)/maxProgress])
      //}
      //Bottom edge
      //if (pixelValues[(pixelValues.length-1)][col] != 0)
      //{
         //Sides
         
         writeFacetBeginning(stream)
         stream.write("vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + (pixelValues[(pixelValues.length-1)][col] * height + baseHeight) + "\n")
         stream.write("vertex " + (pixelValues.length-1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[(pixelValues.length-1)][col - 1] * height + baseHeight) + "\n")
         stream.write("vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + 0 + "\n")
         writeFacetEnd(stream)
 
         writeFacetBeginning(stream)
         stream.write("vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + (pixelValues[(pixelValues.length-1)][col] * height + baseHeight) + "\n")
         stream.write("vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + 0 + "\n")
         stream.write("vertex " + (pixelValues.length-1)*xScale + " " + (col+1)*yScale + " " + 0 + "\n")
         writeFacetEnd(stream)
         
         //Bottom
         
         writeFacetBeginning(stream)
         stream.write("vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + 0 + "\n")
         stream.write("vertex " + centerX + " " + centerY + " " + 0 + "\n")
         stream.write("vertex " + (pixelValues.length-1)*xScale + " " + (col+1)*yScale + " " + 0 + "\n")
         writeFacetEnd(stream)

         
         currentProgress += 3
         postMessage([(currentProgress)/maxProgress])
      //}
   }

   console.log(currentProgress)
   console.log(maxProgress)
   console.log(currentProgress/maxProgress)
 
   stream.write("endsolid pic" + "\n")
}
 
 