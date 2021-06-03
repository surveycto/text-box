/* global fieldProperties, setAnswer, getPluginParameter */

// Detect platform
var isWebCollect = (document.body.className.indexOf('web-collect') >= 0)
var isAndroid = (document.body.className.indexOf('android-collect') >= 0)
var isIOS = (document.body.className.indexOf('ios-collect') >= 0)

var labelContainer = document.querySelector('.label')

// Find the input element
var input = document.getElementById('text-field')

var countContainer = document.querySelector('#char-count')
var remainContainer = document.querySelector('#char-remaining')
var ofContainer = document.querySelector('#of')
var maxContainer = document.querySelector('#char-max')

var numRows = getPluginParameter('rows')
var countChar = getPluginParameter('count')
var charMax = getPluginParameter('max')

if ((numRows == null) || (isNaN(numRows))) {
  numRows = 3
} else {
  numRows = parseInt(numRows)
  if (numRows <= 0) {
    numRows = 3
  }
}
input.rows = numRows

if ((charMax == null) || (isNaN(charMax))) {
  charMax = false
} else {
  charMax = parseInt(charMax)
  // input.maxLength = charMax // NEED TO UNCOMMENT
}

if ((countChar === 1) || ((charMax !== false) && (countChar !== 0))) {
  countChar = true
  countContainer.style.display = ''
  var currentLength = input.value.length
  if (charMax === false) {
    ofContainer.style.display = 'none'
    remainContainer.innerHTML = currentLength
  } else {
    maxContainer.innerHTML = charMax
    remainContainer.innerHTML = charMax - currentLength
  }
} else {
  countChar = false
}

var labelChildren = labelContainer.children
var textDir
if (labelChildren.length === 0) {
  textDir = getComputedStyle(labelContainer).direction
} else {
  textDir = getComputedStyle(labelChildren[0]).direction
}

if (textDir === 'rtl') {
  countContainer.style.textAlign = 'left'
  input.style.textAlign = 'right'

}

// Restricts input for the given textbox to the given inputFilter.
function setInputFilter (textbox, inputFilter) {
  function restrictInput () {
    if (inputFilter(this.value)) {
      this.oldSelectionStart = this.selectionStart
      this.oldSelectionEnd = this.selectionEnd
      this.oldValue = this.value
    } else if (this.hasOwnProperty('oldValue')) {
      this.value = this.oldValue
      this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd)
    } else {
      this.value = ''
    }
  }

  // Apply restriction when typing, copying/pasting, dragging-and-dropping, etc.
  textbox.addEventListener('input', restrictInput)
  textbox.addEventListener('keydown', restrictInput)
  textbox.addEventListener('keyup', restrictInput)
  textbox.addEventListener('mousedown', restrictInput)
  textbox.addEventListener('mousedown', restrictInput)
  textbox.addEventListener('contextmenu', restrictInput)
  textbox.addEventListener('drop', restrictInput)
}

// Set/remove the 'inputmode'.
function setInputMode (attributeValue) {
  if (attributeValue === null) {
    input.removeAttribute('inputmode')
  } else {
    input.setAttribute('inputmode', attributeValue)
  }
}

// If the field label or hint contain any HTML that isn't in the form definition, then the < and > characters will have been replaced by their HTML character entities, and the HTML won't render. We need to turn those HTML entities back to actual < and > characters so that the HTML renders properly. This will allow you to render HTML from field references in your field label or hint.
function unEntity (str) {
  return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}
if (fieldProperties.LABEL) {
  labelContainer.innerHTML = unEntity(fieldProperties.LABEL)
}
if (fieldProperties.HINT) {
  document.querySelector('.hint').innerHTML = unEntity(fieldProperties.HINT)
}

// Define what happens when the user attempts to clear the response
function clearAnswer () {
  input.innerHTML = ''
  input.value = ''
}

// If the field is not marked readonly, then focus on the field and show the on-screen keyboard (for mobile devices)
function setFocus () {
  if (!fieldProperties.READONLY) {
    input.focus()
    if (window.showSoftKeyboard) {
      window.showSoftKeyboard()
    }
  }
}

// Save the user's response (update the current answer)
input.oninput = function () {
  var inputValue = input.value

  // Limiter for Android devices, in case too long
  if ((charMax !== false) && (inputValue.length > charMax)) {
    inputValue = inputValue.substr(0, charMax)
    input.value = inputValue
    input.innerHTML = inputValue
  }

  if (countChar) {
    var inputLength = inputValue.length
    remainContainer.innerHTML = inputLength
    if (charMax !== false) {
      remainContainer.innerHTML = charMax - inputLength
    }
  }

  setAnswer(inputValue)
}

// check for standard appearance options and apply them
if (fieldProperties.APPEARANCE.includes('numbers_phone') === true) {
  input.type = 'tel'
} else if (fieldProperties.APPEARANCE.includes('numbers_decimal') === true) {
  input.pattern = '[0-9]*'

  setInputMode('numeric')

  // For iOS, we'll default the inputmode to 'numeric' (as defined above), unless some specific value is
  // passed as plug-in parameter.
  if (isIOS) {
    var inputModeIOS = getPluginParameter('inputmode-ios')
    if (inputModeIOS !== undefined) {
      setInputMode(inputModeIOS)
    }
  } else if (isAndroid) {
    // For Android, we'll default the inputmode to 'numeric' (as defined above),
    // unless some specific value is passed as plug-in parameter.
    var inputModeAndroid = getPluginParameter('inputmode-android')
    if (inputModeAndroid !== undefined) {
      setInputMode(inputModeAndroid)
    }
  } else if (isWebCollect) {
    // For WebCollect, we'll default the inputmode to 'numeric' (as defined above),
    // unless some specific value is passed as plug-in parameter.
    var inputModeWebCollect = getPluginParameter('inputmode-web')
    if (inputModeWebCollect !== undefined) {
      setInputMode(inputModeWebCollect)
    }
  }

  // If the field is not marked as readonly, then restrict input to decimal only.
  if (!fieldProperties.READONLY) {
    setInputFilter(input, function (value) {
      return /^-?\d*[.,]?\d*$/.test(value)
    })
  }
} else if (fieldProperties.APPEARANCE.includes('numbers') === true) {
  input.type = 'number'
}
