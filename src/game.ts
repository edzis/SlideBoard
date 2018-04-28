import { addLight, addSkybox, loadMesh } from './game-utils'
import {
  Engine,
  WebVRController,
  Vector3,
  Quaternion,
  Scene,
  Mesh,
} from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import BoardState from './BoardState'
import addContent, { SceneContent } from './addContent'

interface ObjectState {
  position: Vector3
  quat: Quaternion
}

enum GameStage {
  UNINITIALIZED,
  LOADING,
  CONTENT_READY,
  VR_READY,
}

type GameState_Uninitialized = {
  stage: GameStage.UNINITIALIZED
}

type GameState_Loading = {
  stage: GameStage.LOADING
  canvas: HTMLCanvasElement
}

type GameState_ContentReady = GameState_Loading & {
  stage: GameStage.CONTENT_READY
  sceneContent: SceneContent
}

type GameState_VRReady = GameState_ContentReady & {
  stage: GameStage.VR_READY
  boardController: WebVRController
  handController: WebVRController
  boardControlerInitialState: ObjectState
}

type GameState =
  | GameState_Uninitialized
  | GameState_Loading
  | GameState_ContentReady
  | GameState_VRReady
type Temp = {} & Partial<GameState_ContentReady> & Partial<GameState_VRReady>

let state: GameState = { stage: GameStage.UNINITIALIZED }
const temp: Temp = {}

const init = (canvas: HTMLCanvasElement) => {
  temp.canvas = canvas
  goto_Loading()
}

const goto_Loading = () => {
  if (state.stage >= GameStage.LOADING) {
    throw new Error('allready initialized')
  }

  if (!temp.canvas) {
    throw new Error('canvas not set')
  }

  state = {
    stage: GameStage.LOADING,
    canvas: temp.canvas,
  }

  const engine = new Engine(state.canvas, true)
  const scene = new Scene(engine)
  const helper = scene.createDefaultVRExperience()
  const contentPromise = addContent(scene)
  console.log('contentPromise', contentPromise)

  contentPromise.then(content => {
    console.log('addContent done', content)

    temp.sceneContent = content
    goto_ContentReady()
  })

  helper.onControllerMeshLoadedObservable.add(registerController)

  scene.enablePhysics()
  scene.registerBeforeRender(update)
  engine.runRenderLoop(() => {
    scene.render()
  })

  console.log('goto_Loading', state)
}

const goto_ContentReady = () => {
  if (state.stage >= GameStage.CONTENT_READY) {
    return
  }

  if (!temp.sceneContent) {
    return
  }

  state = {
    ...(temp as any),
    stage: GameStage.CONTENT_READY,
  }

  console.log('goto_ContentReady', state)
}

const goto_VRReady = () => {
  if (state.stage >= GameStage.LOADING) {
    return
  }

  if (!(temp.boardController && temp.handController)) {
    return
  }

  state = {
    ...(temp as any),
    stage: GameStage.CONTENT_READY,
  }
}

const update = () => {
  if (state.stage >= GameStage.CONTENT_READY) {
    updateGameState(state as GameState_ContentReady)
  }
}

const updateGameState = (state: GameState_ContentReady) => {
  // let deltaTime: number = 1 / _engine.getFps()
  // const { position, quat } = boardState.getBoardState()
  // boardTransform.position = position
  // boardTransform.rotationQuaternion = quat
}

const getControlerState = (controller: WebVRController): ObjectState => {
  return {
    position: controller.devicePosition.clone(),
    quat: controller.deviceRotationQuaternion.clone(),
  }
}

const registerController = (controller: WebVRController) => {
  if (controller.hand === 'left') {
    temp.boardController = controller
  }
  if (controller.hand === 'right') {
    temp.handController = controller
  }
  goto_VRReady()
}

export { init }
