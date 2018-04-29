import { addLight, addSkybox, loadMesh } from './game-utils'
import {
  Engine,
  WebVRController,
  Vector3,
  Quaternion,
  Scene,
  Mesh,
  VRExperienceHelper,
  ExtendedGamepadButton,
  Axis,
  Space,
  Matrix,
} from 'babylonjs'
import * as GUI from 'babylonjs-gui'
import BoardState from './BoardState'
import addContent, { SceneContent } from './addContent'

const UP_VECTOR3 = Vector3.Up()
const ZERO_VECTOR3 = Vector3.Zero()
const SPACE_KEYCODE = 32

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

type GameState_VRReady = {
  stage: GameStage.VR_READY
  sceneContent: SceneContent
  boardController: WebVRController
  handController: WebVRController
  boardControlerInitialState: ObjectState
}

type GameState = GameState_Uninitialized | GameState_VRReady
type Temp = {} & Partial<GameState_VRReady>
let handPower = 0
let keyboardPower = 0
let speed = 0

let state: GameState = { stage: GameStage.UNINITIALIZED }
const temp: Temp = {}

const init = async (canvas: HTMLCanvasElement) => {
  const engine = new Engine(canvas, true)
  const scene = new Scene(engine)

  engine.runRenderLoop(() => {
    scene.render()
  })

  const helper = scene.createDefaultVRExperience()
  const { handController, boardController } = await getControllers(helper)

  let defaultBoardRotation = Vector3.Zero()
  const calibrateState = () => {
    const defaultRotation = boardController.deviceRotationQuaternion.toEulerAngles()
    console.log('defaultRotation', defaultRotation)

    content.ground.position.y = boardController.devicePosition.y - 0.04 - 0.12
    
    // content.newWorldCenter.position = boardController.devicePosition
    // content.newWorldCenter.translate(Axis.Z, 0.4, Space.LOCAL)
    // content.newWorldCenter.translate(Axis.Y, -0.04 - 0.12, Space.LOCAL)
    // content.newWorldCenter.rotation.y = defaultRotation.y
    // content.ground.parent = content.newWorldCenter

    content.boardSurface.parent = boardController.mesh
    content.boardSurface.position = Vector3.Zero()
    content.boardSurface.rotation.x = -0.17
    content.boardSurface.translate(Axis.Z, 0.4, Space.LOCAL)
    content.boardSurface.translate(Axis.Y, -0.04, Space.LOCAL)

    // const defaultBoardState = {
    //   position: handController
    //     ? handController.devicePosition.clone()
    //     : Vector3.Zero(),
    //   rotationQuaternion: boardController
    //     ? boardController.deviceRotationQuaternion.clone()
    //     : Quaternion.Zero(),
    // }

    // const defaultHeadState = {
    //   position: helper.webVRCamera.devicePosition.clone(),
    //   rotationQuaternion: helper.webVRCamera.deviceRotationQuaternion.clone(),
    // }
    // console.log('defaultBoardState', defaultBoardState)
    // console.log('defaultHeadState', defaultHeadState)

    // const defaultBoardRotation = defaultBoardState.rotationQuaternion.toEulerAngles()
    //   .y
    // const defaultHeadRotation = defaultBoardRotation + Math.PI / 2
  }

  if (handController) {
    handController.onTriggerStateChangedObservable.add(button => {
      handPower = button.value
    })
    handController.onSecondaryButtonStateChangedObservable.add(button => {
      if (button.pressed) {
        calibrateState()
      }
    })
  }

  canvas.addEventListener('keydown', e => {
    if (e.keyCode === SPACE_KEYCODE) {
      keyboardPower = 1
    }
  })
  canvas.addEventListener('keyup', e => {
    if (e.keyCode === SPACE_KEYCODE) {
      keyboardPower = 0
    }
  })

  const content = await addContent(scene)

  scene.registerBeforeRender(() => {
    // const headRotation =
    //   ((headRotationQuat.toEulerAngles().y - defaultHeadRotation) /
    //     (Math.PI * 2)) %
    //   Math.PI
    // const direction = headRotation > 0 ? 1 : -1

    const direction = 1
    const power = Math.max(handPower, keyboardPower)
    const timeDiff = 16
    speed = getNewSpeed(speed, direction, power, timeDiff)

    // const directionAxis = content.ground.getDirection(Axis.Z)
    // // console.log('directionAxis', directionAxis)
    // content.ground.translate(directionAxis, -speed, Space.WORLD)

    content.ground.translate(Axis.Z, -speed, Space.WORLD)

    const currentBoardRotation = boardController.deviceRotationQuaternion.toEulerAngles()

    const turnAngle = (currentBoardRotation.z - defaultBoardRotation.z) / 50
    // (currentBoardRotation.z - defaultBoardRotation.z) / 50 * Math.abs(speed)

    // console.log('turnAngle', turnAngle)

    content.ground.rotation(ZERO_VECTOR3, Axis.Y, turnAngle)
    // const y = content.ground.rotationQuaternion.toEulerAngles().y
    // console.log('y', y)

    // content.ground.translate(
    //   content.ground.rotationQuaternion.toEulerAngles(),
    //   -speed,
    //   Space.WORLD
    // )
    // const delta = content.ground.getDirection().scaleInPlace(-speed)
    // content.ground.position.addInPlace(delta)
  })

  engine.runRenderLoop(() => {
    scene.render()
  })
}

const MAX_SPEED = 0.25 // meters in second
const ACCELERATION_TIME = 10 // seconds
const ACCELERATION_STEP = MAX_SPEED / ACCELERATION_TIME / 1000 // speed increase in ms
const SLOWDOWN_STEP = ACCELERATION_STEP / 2 // speed slowdown in ms

const getNewSpeed = (
  currentSpeed: number,
  direction: number,
  power: number,
  timeDiff: number
): number => {
  let speed = currentSpeed + ACCELERATION_STEP * power * direction * timeDiff

  if (power < 1) {
    const slowdown = Math.min(
      speed,
      (1 - power) * SLOWDOWN_STEP * Math.sign(speed) * timeDiff
    )
    speed -= slowdown
  }
  return Math.max(-MAX_SPEED, Math.min(speed, MAX_SPEED))
}

const getControllers = (
  helper: VRExperienceHelper
): Promise<{
  handController: WebVRController
  boardController: WebVRController
}> =>
  new Promise((resolve, reject) => {
    let handController: WebVRController
    let boardController: WebVRController

    helper.onControllerMeshLoadedObservable.add(controller => {
      if (controller.hand === 'right') {
        boardController = controller
      }
      if (controller.hand === 'left') {
        handController = controller
      }
      if (handController && boardController) {
        resolve({
          handController,
          boardController,
        })
      }
    })
  })

const getControlerState = (controller: WebVRController): ObjectState => {
  return {
    position: controller.devicePosition.clone(),
    quat: controller.deviceRotationQuaternion.clone(),
  }
}

export { init }
