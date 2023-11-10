const piano = {
  views: {
    powerButton: document.querySelector('.power'),
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
    allowedKeys: ['a', 's', 'd', 'f', 'g', 'ç', 'l', 'k', 'j', 'h', 'q', 'w', 'e', 'r', 't', 'p', 'o', 'i', 'u', 'y', ';', '.', ',', 'm']
  },
  actions: {
    interval: null
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

const activeNote = key => {
  if (piano.values.isKeyPressed) {
    piano.values.synth.triggerAttack(key.dataset.note)
    key.classList.add('active')
  }
}

const releaseNote = () => piano.values.synth.triggerRelease()

const stopNote = key => {
  piano.values.isKeyPressed = false
  clearInterval(piano.actions.interval)
  setTimeout(() => key.classList.remove('active'), 150)
  releaseNote()
}

const handleClick = event => {
  if (event.target.dataset.note && piano.values.synth) {
    piano.values.isKeyPressed = true
    piano.actions.interval = setInterval(activeNote(event.target), 100)
  }
}

const stopHandleClick = event => {
  if (event.target.dataset.note && piano.values.synth) {
    stopNote(event.target)
  }
}

const handleKeys = event => {
  if(piano.values.allowedKeys.includes(event.key) && !piano.values.isKeyPressed) {
    const keyPressed = document.querySelector(`[data-key="${event.keyCode}"]`) 
    piano.values.isKeyPressed = true
    piano.actions.interval = setInterval(activeNote(keyPressed), 100)
  }
}

const stopHandleKeys = event => {
  if(piano.values.allowedKeys.includes(event.key)) {
    const keyPressed = document.querySelector(`[data-key="${event.keyCode}"]`)
    stopNote(keyPressed)
  }
}

const adjustVolume = () => {
  const volume = (-piano.values.volumeRange + Number(piano.views.volumeControl.value))
  if(volume === -piano.values.volumeRange) {
    piano.values.synth.volume.value = -Infinity
  } else {
    piano.values.synth.volume.value = volume
  }
}

const displayKeys = () => {
  piano.views.keys.forEach(key => key.classList.toggle('hide'))
}

piano.views.powerButton.addEventListener('click', async () => {
  if (piano.views.powerButton.hasAttribute('clicked')) {
    if (piano.values.synth) {
      piano.values.synth.dispose() 
      piano.views.soundSelector.removeEventListener('input', switchSound)
      piano.views.keyboard.removeEventListener('mousedown', handleClick)
      piano.views.keyboard.removeEventListener('mouseup', stopHandleClick)
      piano.views.keyboard.removeEventListener('touchstart', handleClick)
      piano.views.keyboard.removeEventListener('touchend', stopHandleClick)
      document.removeEventListener('keydown', handleKeys)
      document.removeEventListener('keyup', stopHandleKeys)
      piano.views.volumeControl.removeEventListener('input', adjustVolume)
    }

    piano.views.powerButton.removeAttribute('clicked')
    
  } else {

    piano.views.powerButton.setAttribute('clicked', '')
    
    if (await initializeAudio()) {
      setSound(piano.views.soundSelector.value)
      piano.views.soundSelector.addEventListener('input', switchSound)
      piano.views.keyboard.addEventListener('mousedown', handleClick)
      piano.views.keyboard.addEventListener('mouseup', stopHandleClick)
      piano.views.keyboard.addEventListener('touchstart', handleClick)
      piano.views.keyboard.addEventListener('touchend', stopHandleClick)
      document.addEventListener('keydown', handleKeys)
      document.addEventListener('keyup', stopHandleKeys)
      piano.views.volumeControl.addEventListener('input', adjustVolume)
    } 
  }
})

piano.views.keysDisplayControl.addEventListener('click', displayKeys)

