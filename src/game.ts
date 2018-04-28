import { addLight, addSkybox, loadMesh } from './game-utils'
import { Engine } from 'babylonjs'
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

export class Game {
  private _canvas: HTMLCanvasElement
  private _engine: Engine
  private _scene: BABYLON.Scene

  private board: BABYLON.Mesh

  constructor(canvasElement: string) {
    // Create canvas and engine
    this._canvas = <HTMLCanvasElement>document.getElementById(canvasElement)
    this._engine = new BABYLON.Engine(this._canvas, true)
  }

  createScene() {
    var scene = new BABYLON.Scene(this._engine)
    const helper = scene.createDefaultVRExperience()
    ;(window as any).helper = helper

    var light = new BABYLON.HemisphericLight(
      'light1',
      new BABYLON.Vector3(0, 1, 0),
      scene
    )
    light.intensity = 0.7

    addLight(scene)
    addSkybox('/assets/skybox/skybox', scene)

    loadMesh('/assets/road/', 'CUPIC_ROAD.obj', scene, {
      autoAdd: false,
      scale: 0.02,
    }).then(mesh => {
      const box = mesh.getBoundingInfo().boundingBox
      console.log(box)

      const insance = (mesh as BABYLON.Mesh).createInstance('1')
      scene.addMesh(insance)

      const insance2 = (mesh as BABYLON.Mesh).createInstance('2')
      insance2.position.z += (box.maximumWorld.z - box.minimumWorld.z) * 0.02
      scene.addMesh(insance2)
    })
    loadMesh('/assets/skateboard/', 'CUPIC_SKATEBOARD.obj', scene, {
      scale: 0.01,
    }).then(mesh => this.board = mesh)

    this._scene = scene
    return scene
  }

  animate() {
    this._scene.registerBeforeRender(() => {
      let deltaTime: number = 1 / this._engine.getFps()
      this.moveGround(deltaTime)
    })

    this._engine.runRenderLoop(() => {
      this._scene.render()
    })
  }

  moveGround(deltaTime: number) {}
}
