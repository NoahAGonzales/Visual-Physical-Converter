const fs = require ('fs')
const cv = require('../js/opencv')

let pixelValues = null
let userScale = 0
let userHeight = 0
let userBaseHeight = 0
let userSmoothN = 0

/**
 * All messages to this worker will be for converting something. The message will consist of an array with the following elements in this order:
 *    0) The file path of the selected image
 *    1) The file name of the selected image (can be determined from the file path, but has already been computed)
 *    2) A 2-dimensional array of the values of the pixels
 *    3) The scale
 *    4) The height
 *    5) The base height
 *    6) Smoothing passes
 */
onmessage = function (e) {
   //Creating the write stream
   let stream = fs.createWriteStream(e.data[1].split('.')[0] + '.stl', {flags: 'w'})

   //Setup
   pixelValues = e.data[2]
   userScale = e.data[3]
   userHeight = e.data[4]
   userBaseHeight = e.data[5]
   userSmoothN = e.data[6]

   //Process
   smooth(userSmoothN)

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
  * Coverts the already selected file to an stl file
  */
 function convert(stream) {
   // Settings
   let baseHeight = userBaseHeight
   let scale = userScale

   //Adjustments
   let height = 1/255 * userHeight
   let xScale = 1 / ((pixelValues.length-1 > pixelValues[0].length-1) ? (pixelValues.length-1) : (pixelValues[0].length-1)) * scale //Scale based on the larger of the dimensions
   let yScale = 1 / ((pixelValues.length-1 > pixelValues[0].length-1) ? (pixelValues.length-1) : (pixelValues[0].length-1)) * scale //Scale based on the larger of the dimensions
   
   // Status
   let currentProgress = 0
   let maxProgress = 12//(8*Math.floor((pixelValues.length-1)/2)*Math.floor((pixelValues[0].length-1)/2)) + ((pixelValues.length%2==0) ? (2*(pixelValues.length-1)) : (0)) + ((pixelValues.length[0]%2==0) ? (2*(pixelValues[0].length-1)) : (0)) + ((pixelValues.length%2==0 && pixelValues[0].length%2==0) ? (-2) : (0))// + (6*pixelValues.length + 6*pixelValues[0].length - 12) // Every set of 8 facets + facets on edge from even rows/cols + sides + base

   for (let row = 1; row < pixelValues.length; row+=2)
   {
      for (let col = 1; col < pixelValues[0].length; col+=2)
      {
         maxProgress+=2
         if (col+1 < pixelValues[0].length)
            maxProgress +=2
         if (row + 1 < pixelValues.length)
            maxProgress += 2
         if (row + 1 < pixelValues.length && (col+1)< pixelValues[0].length)
            maxProgress += 2
      }
   }

   for (let row = 1; row < (pixelValues.length-1); row++) {
      maxProgress += 6
   }
   for (let col = 1; col < (pixelValues[0].length-1); col++) {
      maxProgress += 6
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

         stream.write(
            /* Top-Left
            *--*
             \ |
               *
            */

            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" + 
            "vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n" + 
            "vertex " + (row-1)*xScale + " " + col*yScale + " " + (pixelValues[(row-1)][col] * height + baseHeight) + "\n" +
            "vertex " + (row-1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[row-1][col-1] * height + baseHeight) + "\n" +
            "endloop" + "\n" + "endfacet" + "\n" +
 
            /* Top-Left
               *
               | \
               *--*
            */
            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n" +
            "vertex " + (row-1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[(row-1)][col - 1] * height + baseHeight) + "\n" +
            "vertex " + row*xScale + " " + (col-1)*yScale + " " + (pixelValues[row][col-1] * height + baseHeight) + "\n" +
            "endloop" + "\n" + "endfacet" + "\n"
         )

         currentProgress+=2
         postMessage([(currentProgress)/maxProgress])
 

         if (col+1 < pixelValues[0].length) //Is this pixel not on the last column
         {
            /* Top-Right
            *--*
            | /
            *
            */
            stream.write("facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n" +
            "vertex " + (row-1)*xScale + " " + (col+1)*yScale + " " + (pixelValues[(row-1)][col + 1] * height + baseHeight) + "\n" +
            "vertex " + (row-1)*xScale + " " + col*yScale + " " + (pixelValues[(row-1)][col] * height + baseHeight) + "\n" +
            "endloop" + "\n" + "endfacet" + "\n" +

            /* Top-Right
                  *
                / |
               *--*
            */
            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n" +
            "vertex " + row*xScale + " " + (col+1)*yScale + " " + (pixelValues[row][col + 1] * height + baseHeight) + "\n" +
            "vertex " + (row-1)*xScale + " " + (col+1)*yScale + " " + (pixelValues[(row-1)][col + 1] * height + baseHeight) + "\n" +
            "endloop" + "\n" + "endfacet" + "\n")

            currentProgress+=2
            postMessage([(currentProgress)/maxProgress])
         }
 
         if (row + 1 < pixelValues.length) //Is this pixel not on the last row?
         {
            /* Bottom-Left
                  *
                / |
               *--*
            */
            stream.write(
               "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
               "vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n" +
               "vertex " + (row+1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[row + 1][col - 1] * height + baseHeight) + "\n" +
               "vertex " + (row+1)*xScale + " " + col*yScale + " " + (pixelValues[row + 1][col] * height + baseHeight) + "\n" +
               "endloop" + "\n" + "endfacet" + "\n" +

               /* Bottom-Left
                  *--*
                  | /
                  *
               */
               "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
               "vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n" +
               "vertex " + row*xScale + " " + (col-1)*yScale + " " + (pixelValues[row][col - 1] * height + baseHeight) + "\n" +
               "vertex " + (row+1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[row + 1][col - 1] * height + baseHeight) + "\n" +
               "endloop" + "\n" + "endfacet" + "\n"
            )
            
            currentProgress+=2
            postMessage([(currentProgress)/maxProgress])
         }
 
         if (row + 1 < pixelValues.length &&(col+1)< pixelValues[0].length)
         {
            /* Bottom-Right
               *
               | \
               *--*
            */
            stream.write("facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n" +
            "vertex " + (row+1)*xScale + " " + col*yScale + " " + (pixelValues[row + 1][col] * height + baseHeight) + "\n" +
            "vertex " + (row+1)*xScale + " " + (col+1)*yScale + " " + (pixelValues[row + 1][col + 1] * height + baseHeight) + "\n" +
            "endloop" + "\n" + "endfacet" + "\n" +
 
            /* Bottom-Right
               *--*
                \ |
                  *
            */
            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + col*yScale + " " + (pixelValues[row][col] * height + baseHeight) + "\n" +
            "vertex " + (row+1)*xScale + " " + (col+1)*yScale + " " + (pixelValues[row + 1][col + 1] * height + baseHeight) + "\n" +
            "vertex " + row*xScale + " " + (col+1)*yScale + " " + (pixelValues[row][col + 1] * height + baseHeight) + "\n" +
            "endloop" + "\n" + "endfacet" + "\n")

            currentProgress+=2
            postMessage([(currentProgress)/maxProgress])
         }
      }
   }

   /*
   * Creating initial triangles for corners (side and bottom) if need be to avoid condition checking for each pixel along the edge
   */
   let centerX = ((pixelValues.length-1))*xScale / 2.0;
   let centerY = ((pixelValues[0].length-1))*yScale / 2.0;
 
   //Top-left corner
      stream.write(
         //Sides
      
         //Left edge going across rows
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + 0 + " " + (pixelValues[0][0] * height + baseHeight) + "\n" +
         "vertex " + 0 + " " + 0 + " " + 0 + "\n" +
         "vertex " + 1*xScale + " " + 0 + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
   
         //Top edge going across columns
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + 0 + " " + (pixelValues[0][0] * height + baseHeight) + "\n" +
         "vertex " + 0 + " " + 1*yScale + " " + 0 + "\n" +
         "vertex " + 0 + " " + 0 + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
 
         //Bottom

         //Left edge going across rows
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + 0 + " " + 0 + "\n" +
         "vertex " + centerX + " " + centerY + " " + 0 + "\n" +
         "vertex " + 1*xScale + " " + 0 + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
         
   
         //Top edge going across columns
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + 0 + " " + 0 + "\n" +
         "vertex " + 0 + " " + 1*yScale + " " + 0 + "\n" +
         "vertex " + centerX + " " + centerY + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n"
      )

      currentProgress += 4
      postMessage([(currentProgress)/maxProgress])
   
   //Bottom-Left corner
      stream.write(
         //Sides
         
         //Left edge going across rows
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + (pixelValues[(pixelValues.length-1)][0] * height + baseHeight) + "\n" +
         "vertex " + (pixelValues.length - 2)*xScale + " " + 0 + " " + (pixelValues[(pixelValues.length-1)][0] * height + baseHeight) + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
   
         //Bottom edge going across columns
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + (pixelValues[(pixelValues.length-1)][0] * height + baseHeight) + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + 0 + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + 1*yScale + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
   
         //Bottom
   
         //Bottom edge going across columns
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + 0 + " " + 0 + "\n" +
         "vertex " + centerX + " " + centerY + " " + 0 + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + 1*yScale + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n"
      )

      currentProgress += 3
      postMessage([(currentProgress)/maxProgress])
    
   //Top-right corner  
      stream.write(
         //Sides
   
         //Top edge going across columns
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[0][(pixelValues[0].length-1)] * height + baseHeight) + "\n" +
         "vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
         "vertex " + 0 + " " + (pixelValues[0].length-2)*yScale + " " + (pixelValues[0][pixelValues[0].length-2] * height + baseHeight) + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
         
         //Right edge going across rows
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[0][(pixelValues[0].length-1)] * height + baseHeight) + "\n" +
         "vertex " + 1*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
         "vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
         
         //Bottom
   
         //Right edge going across rows
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
         "vertex " + 1*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
         "vertex " + centerX + " " + centerY + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n"
      )

      currentProgress += 3
      postMessage([(currentProgress)/maxProgress])

   //Bottom-right corner
   stream.write(
      //Sides
      
      //Right edge going across rows
      "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
      "vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[(pixelValues.length-1)][(pixelValues[0].length-1)] * height + baseHeight) + "\n" +
      "vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
      "vertex " + (pixelValues.length-2)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[pixelValues.length-2][(pixelValues[0].length-1)] * height + baseHeight) + "\n" +
      "endloop" + "\n" + "endfacet" + "\n" +
 
      //Bottom edge going across columns
      "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
      "vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[(pixelValues.length-1)][(pixelValues[0].length-1)] * height + baseHeight) + "\n" +
      "vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-2)*yScale + " " + (pixelValues[(pixelValues.length-1)][pixelValues[0].length - 2] * height + baseHeight) + "\n" +
      "vertex " + (pixelValues.length-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
      "endloop" + "\n" + "endfacet" + "\n"
   )

      currentProgress += 2
      postMessage([(currentProgress)/maxProgress])

    //Creating the base. Every pixel along the edge except the first and last will be used to create 2 facets. Facet 1 consits of the point, the point changed to a value of zero, and the last point. Facet 2 consists of the point, the next point changed to a value of zero, and the point changed to a value of 0;
   for (let row = 1; row < (pixelValues.length-1); row++)
   {
      //Left edge 
         stream.write(
            //Sides
      
            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + 0 + " " + (pixelValues[row][0] * height + baseHeight) + "\n" +
            "vertex " + (row-1)*xScale + " " + 0 + " " + (pixelValues[(row-1)][0] * height + baseHeight) + "\n" +
            "vertex " + row*xScale + " " + 0 + " " + 0 + "\n" +
            "endloop" + "\n" + "endfacet" + "\n" +
   
            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + 0 + " " + (pixelValues[row][0] * height + baseHeight) + "\n" +
            "vertex " + row*xScale + " " + 0 + " " + 0 + "\n" +
            "vertex " + (row+1)*xScale + " " + 0 + " " + 0 + "\n" +
            "endloop" + "\n" + "endfacet" + "\n" +

            //Bottom
         
            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + 0 + " " + 0 + "\n" +
            "vertex " + centerX + " " + centerY + " " + 0 + "\n" +
            "vertex " + (row+1)*xScale + " " + 0 + " " + 0 + "\n" +
            "endloop" + "\n" + "endfacet" + "\n"
         )
 
         currentProgress += 3
         postMessage([(currentProgress)/maxProgress])

      //Right edge
         stream.write(
            //Sides
            
            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[row][(pixelValues[0].length-1)] * height + baseHeight) + "\n" +
            "vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
            "vertex " + (row-1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[row-1][(pixelValues[0].length-1)] * height + baseHeight) + "\n" +
            "endloop" + "\n" + "endfacet" + "\n" +
   
            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + (pixelValues[row][(pixelValues[0].length-1)] * height + baseHeight) + "\n" +
            "vertex " + (row+1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
            "vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
            "endloop" + "\n" + "endfacet" + "\n" +
   
            //Bottom
            
            "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
            "vertex " + row*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
            "vertex " + (row+1)*xScale + " " + (pixelValues[0].length-1)*yScale + " " + 0 + "\n" +
            "vertex " + centerX + " " + centerY + " " + 0 + "\n" +
            "endloop" + "\n" + "endfacet" + "\n"
         )

         currentProgress += 3
         postMessage([(currentProgress)/maxProgress])
   }

   for (let col = 1; col < (pixelValues[0].length-1); col++)
   {
      //Top 
      stream.write(
         //Sides
         
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + col*yScale + " " + (pixelValues[0][col] * height + baseHeight) + "\n" +
         "vertex " + 0 + " " + col*yScale + " " + 0 + "\n" +
         "vertex " + 0 + " " + (col-1)*yScale + " " + (pixelValues[0][col-1] * height + baseHeight) + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
 
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + col*yScale + " " + (pixelValues[0][col] * height + baseHeight) + "\n" +
         "vertex " + 0 + " " + (col+1)*yScale + " " + 0 + "\n" +
         "vertex " + 0 + " " + col*yScale + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
 
         // Bottom
         
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + 0 + " " + col*yScale + " " + 0 + "\n" +
         "vertex " + 0 + " " + (col+1)*yScale + " " + 0 + "\n" +
         "vertex " + centerX + " " + centerY + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n"
      )

         currentProgress += 3
         postMessage([(currentProgress)/maxProgress])

      //Bottom edge
      stream.write(
         //Sides
         
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + (pixelValues[(pixelValues.length-1)][col] * height + baseHeight) + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + (col-1)*yScale + " " + (pixelValues[(pixelValues.length-1)][col - 1] * height + baseHeight) + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
 
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + (pixelValues[(pixelValues.length-1)][col] * height + baseHeight) + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + 0 + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + (col+1)*yScale + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n" +
         
         //Bottom
         
         "facet normal 0 0 0" + "\n" + "outer loop" + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + col*yScale + " " + 0 + "\n" +
         "vertex " + centerX + " " + centerY + " " + 0 + "\n" +
         "vertex " + (pixelValues.length-1)*xScale + " " + (col+1)*yScale + " " + 0 + "\n" +
         "endloop" + "\n" + "endfacet" + "\n"
      )

         currentProgress += 3
         postMessage([(currentProgress)/maxProgress])
   }
 
   stream.write("endsolid pic" + "\n")
}
 
 