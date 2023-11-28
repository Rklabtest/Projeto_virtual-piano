const piano = {
  views: {
    container: document.querySelector('.container'),
    powerButton: document.querySelector('.power input'),
    volumeControl: document.querySelector('.volume-slider input'),
    soundSelector: document.querySelector('.sound-selector input'),
    keysDisplayControl: document.querySelector('.keys-check'),
    keyboard: document.querySelector('.piano-keys'),
    keys: document.querySelectorAll('.key')
  },
  values: {
    synth: null,
    audioContext: null,
    volumeRange: 40,
    isKeyPressed: false,
    allowedKeys: ['a', 's', 'd', 'f', 'g', 'ç', 'l', 'k', 'j', 'h', 'q', 'w', 'e', 'r', 't', 'p', 'o', 'i', 'u', 'y', ';', '.', ',', 'm'],
    notesPlayed: [],
    previousKeyCalled: null
  }
}

const initializeAudio = async () => {
  if (!piano.values.audioContext) {
    piano.values.audioContext = new AudioContext()
    Tone.setContext(piano.values.audioContext)
  }

  try {
    if (piano.values.audioContext.state === 'suspended') {
      await Tone.start()
    }
    return true

  } catch (error) {
    console.error(error)
    return false
  }
}

const chooseTypeOfSound = () => ({
  '1': new Tone.Synth().toDestination(),
  '2': new Tone.MonoSynth({
    oscillator: {type: 'square'},
    envelope: {attack: 0.1}  
  }).toDestination(),
  '3': new Tone.FMSynth().toDestination()
})

const setSound = option => {
  piano.values.synth = chooseTypeOfSound()[option]
  piano.values.synth.volume = piano.views.volumeControl.value
  adjustVolume()
}

const switchSound = async event => {
  piano.values.synth.dispose()
  if(await initializeAudio()) {
    setSound(event.target.value)
  }
}

const releaseNote = () => piano.values.synth.triggerRelease()

const testTargetFormat = event => event.target ? event.target : event

const activeNote = key => {
  piano.values.synth.triggerAttack(key.dataset.note)
  key.classList.add('active')
  piano.values.previousKeyCalled = key
}

const stopNote = key => {
  setTimeout(() => key.classList.remove('active'), 150)
  releaseNote()
}

const processInputNote = (event, status) => {
  const target = testTargetFormat(event)
  
  if(target.dataset.note && piano.values.synth) {
    if(status === 'start' && piano.values.previousKeyCalled !== target) {
      if(piano.values.previousKeyCalled) {
        stopNote(piano.values.previousKeyCalled)
      }
        
      activeNote(target)
    } 

    if(status === 'stop') {
      stopNote(target)
      piano.values.previousKeyCalled = null
    }
  }
}

const handleClickDown = event => {
  const currentKey = event.target
  processInputNote(currentKey, 'start')
  piano.values.notesPlayed.push(currentKey)
}

const handlePointerMoves = event => {
  if(!piano.values.notesPlayed.length || !event) {
    return
  }

  const currentKey = testTargetFormat(event)

  if (!piano.values.notesPlayed.includes(currentKey) && currentKey.dataset.note) { 
    processInputNote(piano.values.notesPlayed[piano.values.notesPlayed.length - 1], 'stop')
    processInputNote(currentKey, 'start')
    piano.values.notesPlayed.push(currentKey)

  } else if (piano.values.notesPlayed[piano.values.notesPlayed.length - 2] === currentKey) {
    processInputNote(piano.values.notesPlayed[piano.values.notesPlayed.length - 1], 'stop')
    piano.values.notesPlayed.pop()
    processInputNote(currentKey, 'start')
  
  } else if (!currentKey.dataset.note && piano.values.synth) {
    processInputNote(piano.values.notesPlayed[piano.values.notesPlayed.length - 1], 'stop')
    piano.values.notesPlayed = []
  }
}

const handleClickRelease = () => {
  if(piano.values.notesPlayed.length) {
    processInputNote(piano.values.notesPlayed[piano.values.notesPlayed.length - 1], 'stop')
    piano.values.notesPlayed = []
  }
}

const handleTouchStart = event => {
  if(document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY) !== piano.views.container) {
    handleClickDown(event)
  }
}

const handleTouchMoves = event => {
  event.preventDefault()
  const currentKey = document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY)
  // if(currentKey !== piano.views.container)
  handlePointerMoves(currentKey)
}

const handleTouchEnd = event => {
  event.preventDefault()
  handleClickRelease()
}

const handleMoveOut = event => {
  if(!event.target.dataset.note && piano.values.notesPlayed.length) {
    processInputNote(piano.values.notesPlayed[piano.values.notesPlayed.length - 1], 'stop')
    piano.values.notesPlayed = []
  }
}

const handleKeyDown = event => {
  const keyPressed = document.querySelector(`[data-key="${event.keyCode}"]`) 

  if(piano.values.allowedKeys.includes(event.key)) {
    processInputNote(keyPressed, 'start')
  }
}

const handleKeyUp = event => {
  const keyPressed = document.querySelector(`[data-key="${event.keyCode}"]`)
  
  if(!piano.values.previousKeyCalled) {
    return
  }

  if(piano.values.allowedKeys.includes(event.key) && piano.values.previousKeyCalled.dataset.note === keyPressed.dataset.note) {
    processInputNote(keyPressed, 'stop')
  }
}

const adjustVolume = () => {
  const volume = (-piano.values.volumeRange + Number(piano.views.volumeControl.value))
  
  piano.values.synth.volume.value = volume === -piano.values.volumeRange
    ? -Infinity
    : volume
}

const displayKeys = () => piano.views.keys.forEach(key => key.classList.toggle('hide'))

piano.views.powerButton.addEventListener('click', async () => {
  if (piano.views.powerButton.hasAttribute('clicked')) {
    if (piano.values.synth) {
      piano.values.synth.dispose() 

      piano.views.soundSelector.removeEventListener('input', switchSound)
      piano.views.volumeControl.removeEventListener('input', adjustVolume)
      
      piano.views.keyboard.removeEventListener('mousedown', handleClickDown)
      piano.views.keyboard.removeEventListener('mousemove', handlePointerMoves)
      piano.views.keyboard.removeEventListener('mouseup', handleClickRelease)
      
      piano.views.keyboard.removeEventListener('touchstart', handleTouchStart)
      piano.views.keyboard.removeEventListener('touchmove', handleTouchMoves)
      piano.views.keyboard.removeEventListener('touchend', handleTouchEnd)

      piano.views.container.removeEventListener('mouseover', handleMoveOut)

      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
    
    piano.views.powerButton.removeAttribute('clicked')
    
  } else {
    piano.views.powerButton.setAttribute('clicked', '') 
    
    if (await initializeAudio()) {
      setSound(piano.views.soundSelector.value)

      piano.views.soundSelector.addEventListener('input', switchSound)
      piano.views.volumeControl.addEventListener('input', adjustVolume)
      
      piano.views.keyboard.addEventListener('mousedown', handleClickDown)
      piano.views.keyboard.addEventListener('mousemove', handlePointerMoves)
      piano.views.keyboard.addEventListener('mouseup', handleClickRelease)
      
      piano.views.keyboard.addEventListener('touchstart', handleTouchStart)
      piano.views.keyboard.addEventListener('touchmove', handleTouchMoves)
      piano.views.keyboard.addEventListener('touchend', handleTouchEnd)

      piano.views.container.addEventListener('mouseover', handleMoveOut)

      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
    } 
  }
})

piano.views.container.addEventListener('contextmenu', event => event.preventDefault())
piano.views.keysDisplayControl.addEventListener('click', displayKeys)
