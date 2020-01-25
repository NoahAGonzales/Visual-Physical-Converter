// Ensuring that Jquery has loaded correctly
window.onload = function() {
   if (!window.jQuery) {  
       // jQuery is loaded  
       alert("Please check your connection!");
   }
}

var scene = new THREE.Scene()

// Scene 
// background
scene.background = new THREE.Color(0x000000);
 

// Camera
var camera = new THREE.PerspectiveCamera( 75, (window.innerWidth*0.7)/window.innerHeight, 0.1, 1000 )
camera.position.set(500,500,500)
camera.lookAt(0,0,0)

// Renderer
var renderer = new THREE.WebGLRenderer()
let container = document.getElementById('preview-container')
renderer.setSize($(container).width(), $(container).height() )
container.appendChild( renderer.domElement )

//Shadows
renderer.shadowMap.enabled = true
renderer.shadowMapSoft = true

renderer.shadowCameraNear = 3
renderer.shadowCameraFar = camera.far
renderer.shadowCameraFov = 50

renderer.shadowMapBias = 0.0039
renderer.shadowMapDarkness = 0.5
renderer.shadowMapWidth = 1024
renderer.shadowMapHeight = 1024


// Controls
controls = new THREE.OrbitControls( camera, renderer.domElement )
controls.rotateSpeed = 1.0
controls.zoomSpeed = 1.2
controls.panSpeed = 0.2
 
controls.noZoom = false
controls.noPan = false
 
controls.staticMoving = false
controls.dynamicDampingFactor = 0.3
 
controls.minDistance = 1.1
controls.maxDistance = 100
 
controls.keys = [ 16, 17, 18 ] // [ rotateKey, zoomKey, panKey ]


/*********Example  */

   // Cube
   var cube = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshLambertMaterial({
          color: 0xff0000
      }));
cube.position.set(0, 20, 0);
cube.castShadow = true
scene.add(cube);

// add plane to the scene
// add plane to the scene
var plane = new THREE.Mesh(
   new THREE.PlaneBufferGeometry(1500, 1500, 8, 8),
   new THREE.MeshLambertMaterial({
       color: 0x00afaf,
       emissive: 0x2a2a2a,
       emissiveIntensity: .5,
       side: THREE.DoubleSide
}));
plane.rotation.x = Math.PI / 2;
plane.receiveShadow = true
scene.add(plane);

// spotlight, and spotLight helper
/*
var spotLight = new THREE.SpotLight(),
spotLightHelper = new THREE.SpotLightHelper(spotLight);
spotLight.add(spotLightHelper);
scene.add(spotLight);
*/

let directionalLight0 = new THREE.SpotLight(0xffffff, 0.6)
let directionalLightHelper0 = new THREE.SpotLightHelper(directionalLight0)
directionalLight0.add(directionalLightHelper0)
scene.add(directionalLight0)

let directionalLight1 = new THREE.SpotLight(0xffffff, 0.6)
let directionalLightHelper1 = new THREE.SpotLightHelper(directionalLight1)
directionalLight1.add(directionalLightHelper1)
scene.add(directionalLight1)

directionalLight0.position.set(100,50,-100)
directionalLight1.position.set(-100,50,100)

directionalLightHelper0.update()
directionalLightHelper1.update()

let ambientLight = new THREE.AmbientLight(0xff0000)
scene.add(ambientLight)

// set position of spotLight,
// and helper bust be updated when doing that
//spotLight.position.set(100, 200, -100);
//spotLightHelper.update();

var grid = new THREE.GridHelper(100, 10);
scene.add(grid);

// Shapes
let geometry = new THREE.BufferGeometry();
let vertices = new Float32Array( [
	-1.0, -1.0,  1.0,
	 1.0, -1.0,  1.0,
	 1.0,  1.0,  1.0,

	 1.0,  1.0,  1.0,
	-1.0,  1.0,  1.0,
	-1.0, -1.0,  1.0
] );

geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
var material  = new THREE.MeshPhongMaterial({color: 0xff0000})
var mesh = new THREE.Mesh(geometry, material)
mesh.castShadow = true
mesh.receiveShadow = true
scene.add(mesh)


//Resizes canvas
function resizeCanvasToElementSize() {
   renderer.setSize($(container).width(), $(container).height() )
   camera.aspect = $(container).width() / $(container).height()
   camera.updateProjectionMatrix()
}

// Updating the preview when a value is changed and there are no errors
function updatePreview() {
   console.log('updating preview')
   
   // If no invalid input
   

   //Remove mesh from scene and clean up
   if(mesh) {
      scene.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
      mesh = undefined
   }

   // Refresh pixel values given the new picture
   generatePixelValues()

   if(pixelValues == null) {
      return
   }

   let pValues = pixelValues

   console.log(pValues)
   let scale = parseFloat(document.getElementById('scale-text-input').value)
   let height = parseFloat(document.getElementById('height-text-input').value)
   let baseHeight = parseFloat(document.getElementById('base-height-text-input').value)
   let smoothN = parseFloat(document.getElementById('smoothing-text-input').value)

   let xScale = 1 / ((pValues.length-1 > pValues[0].length-1) ? (pValues.length-1) : (pValues[0].length-1)) * scale //Scale based on the larger of the dimensions
   let yScale = 1 / ((pValues.length-1 > pValues[0].length-1) ? (pValues.length-1) : (pValues[0].length-1)) * scale //Scale based on the larger of the dimensions

   let centerX = ((pValues.length-1))*xScale / 2.0;
   let centerY = ((pValues[0].length-1))*yScale / 2.0;

   // Building verts
   verts = []
   norms = []

   for(let passes = 0; passes < smoothN; passes++) {
      // Smoothing the values with the pixel values on all adjacent sides
      for(let row = 1; row < pValues.length-1; row++) {
         for(let col = 1; col < pValues[0].length-1; col++) {
            pValues[row][col] = (pValues[row-1][col] + pValues[row][col] + pValues[row+1][col] + pValues[row][col-1] + pValues[row][col+1])/5
         }
      }
   }

   for (let row = 1; row < pValues.length; row+=2)
   {
      for (let col = 1; col < pValues[0].length; col+=2)
      {
         verts.push( 
            //Top left
            row*xScale, (pValues[row][col] * height + baseHeight), col*yScale,   
            (row-1)*xScale, (pValues[(row-1)][col] * height + baseHeight), col*yScale,  
            (row-1)*xScale, (pValues[row-1][col-1] * height + baseHeight), (col-1)*yScale, 

            row*xScale, (pValues[row][col] * height + baseHeight), col*yScale, 
            (row-1)*xScale, (pValues[(row-1)][col - 1] * height + baseHeight), (col-1)*yScale,  
            row*xScale, (pValues[row][col-1] * height + baseHeight), (col-1)*yScale, 
         )

         norms.push(
            0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
         )

         // Top Right
         if (col+1 < pValues[0].length) {
            verts.push(
               row*xScale, (pValues[row][col] * height + baseHeight), col*yScale,  
               (row-1)*xScale, (pValues[(row-1)][col + 1] * height + baseHeight), (col+1)*yScale,  
               (row-1)*xScale, (pValues[(row-1)][col] * height + baseHeight), col*yScale,

               row*xScale, (pValues[row][col] * height + baseHeight), col*yScale, 
               row*xScale, (pValues[row][col + 1] * height + baseHeight), (col+1)*yScale, 
               (row-1)*xScale, (pValues[(row-1)][col + 1] * height + baseHeight), (col+1)*yScale, 
            )

            norms.push(
               0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,            
            )
         }

         // Bottom left
         if (row + 1 < pValues.length) {
            verts.push(
               row*xScale, (pValues[row][col] * height + baseHeight), col*yScale, 
               (row+1)*xScale, (pValues[row + 1][col - 1] * height + baseHeight), (col-1)*yScale,  
               (row+1)*xScale, (pValues[row + 1][col] * height + baseHeight), col*yScale, 

               row*xScale, (pValues[row][col] * height + baseHeight), col*yScale, 
               row*xScale, (pValues[row][col - 1] * height + baseHeight), (col-1)*yScale, 
               (row+1)*xScale, (pValues[row + 1][col - 1] * height + baseHeight), (col-1)*yScale,  
            )

            norms.push(
               0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
            )
         }

         // Bottom right
         if (row + 1 < pValues.length &&(col+1)< pValues[0].length) {
            verts.push(
               row*xScale, (pValues[row][col] * height + baseHeight), col*yScale,  
               (row+1)*xScale, (pValues[row + 1][col] * height + baseHeight), col*yScale, 
               (row+1)*xScale, (pValues[row + 1][col + 1] * height + baseHeight), (col+1)*yScale, 

               row*xScale, (pValues[row][col] * height + baseHeight), col*yScale,  
               (row+1)*xScale, (pValues[row + 1][col + 1] * height + baseHeight), (col+1)*yScale, 
               row*xScale, (pValues[row][col + 1] * height + baseHeight), (col+1)*yScale,  
            )

            norms.push(
               0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
            )
         }
      }

      
      /*
      * Creating initial triangles for corners (side and bottom) if need be to avoid condition checking for each pixel along the edge
      */
      verts.push(
         // Top left corner

         //Sides  
         // Left edge going across rows
         0, (pValues[0][0] * height + baseHeight), 0,  
         0, 0, 0, 
         1*xScale, 0, 0,
         //Top edge going across columns
         0, (pValues[0][0] * height + baseHeight), 0,  
         0,  0, 1*yScale, 
         0, 0, 0,
         //Bottom
         //Left edge going across rows
         0, 0, 0,
         centerX, 0, centerY, 
         1*xScale, 0, 0, 
         //Top edge going across columns
         0, 0, 0, 
         0,  0, 1*yScale, 
         centerX, 0, centerY, 

         //Bottom left corner

         // Sides
         //Left edge going across rows 
         (pValues.length-1)*xScale, (pValues[(pValues.length-1)][0] * height + baseHeight), 0,  
         (pValues.length - 2)*xScale, (pValues[(pValues.length-1)][0] * height + baseHeight), 0,  
         (pValues.length-1)*xScale, 0, 0, 
         //Bottom edge going across columns
         (pValues.length-1)*xScale, (pValues[(pValues.length-1)][0] * height + baseHeight), 0,  
         (pValues.length-1)*xScale, 0, 0, 
         (pValues.length-1)*xScale, 0, 1*yScale,  
         //Bottom
         //Bottom edge going across columns
         (pValues.length-1)*xScale, 0, 0,
         centerX, 0, centerY, 
         (pValues.length-1)*xScale,  0, 1*yScale,
          

         // Top-right corner
         //Sides
         //Top edge going across columns
         0, (pValues[0][(pValues[0].length-1)] * height + baseHeight), (pValues[0].length-1)*yScale,  
         0, 0, (pValues[0].length-1)*yScale, 
         0, (pValues[0][pValues[0].length-2] * height + baseHeight), (pValues[0].length-2)*yScale,  
         //Right edge going across rows
         0, (pValues[0][(pValues[0].length-1)] * height + baseHeight), (pValues[0].length-1)*yScale,  
         1*xScale, 0, (pValues[0].length-1)*yScale, 
         0, 0, (pValues[0].length-1)*yScale,  
         //Bottom
         //Right edge going across rows
         0, 0, (pValues[0].length-1)*yScale, 
         1*xScale, 0, (pValues[0].length-1)*yScale,  
         centerX, 0, centerY, 

         // Bottom right corner

         //Sides
         //Right edge going across rows
         (pValues.length-1)*xScale, (pValues[(pValues.length-1)][(pValues[0].length-1)] * height + baseHeight), (pValues[0].length-1)*yScale, 
         (pValues.length-1)*xScale, 0, (pValues[0].length-1)*yScale, 
         (pValues.length-2)*xScale, (pValues[pValues.length-2][(pValues[0].length-1)] * height + baseHeight), (pValues[0].length-1)*yScale, 
         //Bottom
         //Bottom edge going across columns
         (pValues.length-1)*xScale, (pValues[(pValues.length-1)][(pValues[0].length-1)] * height + baseHeight), (pValues[0].length-1)*yScale,  
         (pValues.length-1)*xScale, (pValues[(pValues.length-1)][pValues[0].length - 2] * height + baseHeight), (pValues[0].length-2)*yScale,  
         (pValues.length-1)*xScale, 0, (pValues[0].length-1)*yScale, 
      )

      norms.push(
         0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
         0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
         0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
         0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
         0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
         0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
      )
      

      //Creating the base. Every pixel along the edge except the first and last will be used to create 2 facets. Facet 1 consits of the point, the point changed to a value of zero, and the last point. Facet 2 consists of the point, the next point changed to a value of zero, and the point changed to a value of 0;
      for (let row = 1; row < (pValues.length-1); row++) {
         verts.push(
            //Left edge 

            //Sides            
            row*xScale, (pValues[row][0] * height + baseHeight), 0,  
            (row-1)*xScale, (pValues[(row-1)][0] * height + baseHeight), 0,   
            row*xScale, 0,  0, 
            row*xScale, (pValues[row][0] * height + baseHeight), 0,  
            row*xScale,  0,  0,
            (row+1)*xScale,  0,  0,            
            //Bottom            
            row*xScale,  0,  0, 
            centerX, 0, centerY,   
            (row+1)*xScale,  0,  0, 
            
            //Right edge

            //Sides            
            row*xScale, (pValues[row][(pValues[0].length-1)] * height + baseHeight), (pValues[0].length-1)*yScale, 
            row*xScale, 0, (pValues[0].length-1)*yScale,  
            (row-1)*xScale,  (pValues[row-1][(pValues[0].length-1)] * height + baseHeight), (pValues[0].length-1)*yScale,                         
            row*xScale,  (pValues[row][(pValues[0].length-1)] * height + baseHeight), (pValues[0].length-1)*yScale,  
            (row+1)*xScale, 0, (pValues[0].length-1)*yScale,  
            row*xScale, 0, (pValues[0].length-1)*yScale,  
            
            //Bottom            
            row*xScale, 0, (pValues[0].length-1)*yScale,  
            (row+1)*xScale, 0, (pValues[0].length-1)*yScale,  
            centerX, 0, centerY,  
         )  

         norms.push(
            0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
            0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
            0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
         )
      }

      
   for (let col = 1; col < (pValues[0].length-1); col++)
   {
      verts.push(
         //Top 
         
         //Sides         
         0, (pValues[0][col] * height + baseHeight), col*yScale,  
         0, 0, col*yScale,  
         0, (pValues[0][col-1] * height + baseHeight), (col-1)*yScale,                   
         0, (pValues[0][col] * height + baseHeight), col*yScale,  
         0, 0, (col+1)*yScale,   
         0, 0, col*yScale,            
         // Bottom         
         0, 0, col*yScale,  
         0, 0, (col+1)*yScale, 
         centerX, 0, centerY,  
         
         
         //Bottom edge

         //Sides         
         (pValues.length-1)*xScale, (pValues[(pValues.length-1)][col] * height + baseHeight), col*yScale,   
         (pValues.length-1)*xScale, (pValues[(pValues.length-1)][col - 1] * height + baseHeight), (col-1)*yScale,  
         (pValues.length-1)*xScale, 0, col*yScale,                     
         (pValues.length-1)*xScale, (pValues[(pValues.length-1)][col] * height + baseHeight), col*yScale,  
         (pValues.length-1)*xScale, 0, col*yScale,  
         (pValues.length-1)*xScale, 0, (col+1)*yScale,                    
         //Bottom                  
         (pValues.length-1)*xScale, 0, col*yScale,  
         centerX, 0, centerY, 
         (pValues.length-1)*xScale, 0, (col+1)*yScale,   
      )

      norms.push(
         0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
         0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
         0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,  0,1,0,
      )
   }
}

   vertices = Float32Array.from(verts)
   normals = Float32Array.from(norms)

   console.log(verts)
   console.log(normals)

   // Make new geometry
   geometry = new THREE.BufferGeometry();

   geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
   geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
   material  = new THREE.MeshPhongMaterial({color: 0xffffff})
   mesh = new THREE.Mesh(geometry, material)

   geometry.computeVertexNormals()

   scene.add(mesh)

}

document.getElementById('scale-text-input').addEventListener('keyup', function(){console.log('option changed');updatePreview()})
document.getElementById('height-text-input').addEventListener('keyup', function(){console.log('option changed');updatePreview()})
document.getElementById('base-height-text-input').addEventListener('keyup', function(){console.log('option changed');updatePreview()})
document.getElementById('smoothing-text-input').addEventListener('keyup', function(){console.log('option changed');updatePreview()})


let animate = function () {
   requestAnimationFrame( animate )
   controls.update()
   resizeCanvasToElementSize()
   renderer.render( scene, camera )
}

animate()