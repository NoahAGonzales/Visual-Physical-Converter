
/******************************************************************************************************
   Filters
*/
function filterScaleInput(e) {
   if(e.type == 'keypress') {

      let text = document.getElementById('scale-text-input').value
      let key = e.key
      //If the key is a digit or decimal place and if there has not been a decimal place before
      if(((key >= '0' && key <= '9') || (key == '.' && !text.includes("."))) && text.length < 12)
         return true
   }
   return false
}


function filterHeightInput(e) {
   if(e.type == 'keypress') {
      let text = document.getElementById('height-text-input').value
      let key = e.key
      //If the key is a digit or decimal place and if there has not been a decimal place before
      if(((key >= '0' && key <= '9') || (key == '.' && !text.includes("."))) && text.length < 12)
         return true
   }
   return false
}


function filterBaseHeightInput(e) {
   if(e.type == 'keypress') {
      let text = document.getElementById('base-height-text-input').value
      let key = e.key
      //If the key is a digit or decimal place and if there has not been a decimal place before
      if(((key >= '0' && key <= '9') || (key == '.' && !text.includes("."))) && text.length < 12)
         return true
   }
   return false
}

function filterSmoothingInput(e) {
   if(e.type == 'keypress') {
      let text = document.getElementById('smoothing-text-input').value
      let key = e.key
      //If the key is a digit or decimal place and if there has not been a decimal place before
      if(((key >= '0' && key <= '9') || (key == '.' && !text.includes("."))) && text.length < 12)
         return true
   }
   return false
}

/***********************************************************************************************
   Error checking
 */

document.getElementById('scale-text-input').addEventListener('keyup', function() {
   let text = document.getElementById('scale-text-input').value
   let error = ""
   if(text.length == 0) {
      error += "Scale cannot be empty!"
   }
   if (text == "." || parseFloat(text) == NaN) {
      error += "Scale should be a value!"
   }
   if (parseFloat(text) == 0) {
      error += "Scale cannot be 0!"
   }

   document.getElementById('scale-error').innerHTML = error
})

document.getElementById('height-text-input').addEventListener('keyup', function() {
   let text = document.getElementById('height-text-input').value
   let error = ""
   if(text.length == 0) {
      error += "Height cannot be empty!"
   }
   if ( text == "." || parseFloat(text) == NaN) {
      error += "Height should be a value!"
   }
   if (parseFloat(text) == "0") {
      error += "Height cannot be 0!"
   }

   document.getElementById('height-error').innerHTML = error
})

document.getElementById('base-height-text-input').addEventListener('keyup', function() {
   let text = document.getElementById('base-height-text-input').value
   let error = ""
   if(text.length == 0) {
      error += "Base height cannot be empty!"
   }
   if (text == "." || parseFloat(text) == NaN) {
      error += "Base height should be a value!"
   }
   if (parseFloat(text) == "0") {
      error += "Base height cannot be 0!"
   }

   document.getElementById('base-height-error').innerHTML = error
})

document.getElementById('smoothing-text-input').addEventListener('keyup', function() {
   let text = document.getElementById('smoothing-text-input').value 
   let error = ""
   if(text.length == 0) {
      error += "Smoothing cannot be empty!"
   }
   if (text == "." || parseFloat(text) == NaN) {
      error += "Smoothing should be a value!"
   }

   document.getElementById('smoothing-error').innerHTML = error
})