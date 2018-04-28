import { init } from './game'
import 'babylonjs-materials'
import 'babylonjs-loaders'
import CANNON = require('cannon')

window.addEventListener('DOMContentLoaded', () => {
  // Set global variable for cannonjs physics engine
  window.CANNON = CANNON

  const canvas = <HTMLCanvasElement>document.getElementById('renderCanvas')
  init(canvas)
})
