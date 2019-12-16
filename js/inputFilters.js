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