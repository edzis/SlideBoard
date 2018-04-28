import { addLight, addSkybox, loadMesh } from './game-utils'
import { Engine } from 'babylonjs'
import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import BoardState from './BoardState'

export class Game {
  private _canvas: HTMLCanvasElement
  private _engine: Engine
  private _scene: BABYLON.Scene

  private boardState: BoardState
  private boardTransform: BABYLON.TransformNode

  constructor(canvasElement: string) {
    // Create canvas and engine
    this._canvas = <HTMLCanvasElement>document.getElementById(canvasElement)
    this._engine = new BABYLON.Engine(this._canvas, true)
    this.boardState = new BoardState(
      new BABYLON.Vector3(0, -0, 0),
      new BABYLON.Vector3(-0.4, -0.1, -0.25)
    )
  }

  createScene() {
    var scene = new BABYLON.Scene(this._engine)
    const helper = scene.createDefaultVRExperience()
    ;(window as any).helper = helper

    helper.onControllerMeshLoadedObservable.add(controller => {
      this.boardState.registerController(controller)
    })

    var light = new BABYLON.HemisphericLight(
      'light1',
      new BABYLON.Vector3(0, 1, 0),
      scene
    )
    light.intensity = 0.7

    addLight(scene)
    addSkybox('/assets/skybox/skybox', scene)

    loadMesh('/assets/road/', 'CUPIC_ROAD.obj', scene).then(mesh => {
      mesh.scaling.scaleInPlace(0.02)
      const box = mesh.getBoundingInfo().boundingBox
      console.log(box)

      const insance = (mesh as BABYLON.Mesh).createInstance('1')
      scene.addMesh(insance)

      const insance2 = (mesh as BABYLON.Mesh).createInstance('2')
      insance2.position.z += (box.maximumWorld.z - box.minimumWorld.z) * 0.02
      scene.addMesh(insance2)
    })
    loadMesh('/assets/skateboard/', 'CUPIC_SKATEBOARD.obj', scene, true).then(
      mesh => {
        this.boardTransform = new BABYLON.TransformNode(
          'transformNode-' + mesh.name
        )

        mesh.scaling.scaleInPlace(0.0045)
        mesh.position.x -= 0.05
        mesh.parent = this.boardTransform
      }
    )

    this._scene = scene
    return scene
  }

  animate() {
    this._scene.registerBeforeRender(() => {
      let deltaTime: number = 1 / this._engine.getFps()
      this.moveGround(deltaTime)
      if (this.boardTransform) {
        if(!this.boardState.calibration) {
          this.boardState.calibrate()
        }
        // console.log(this.board.position)

        const { position, quat} = this.boardState.getBoardState()
        this.boardTransform.position = position
        this.boardTransform.rotationQuaternion = quat
      }
    })

    this._engine.runRenderLoop(() => {
      this._scene.render()
    })
  }

  moveGround(deltaTime: number) {}
}
