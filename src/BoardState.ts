import { WebVRController, Vector3, Quaternion } from 'babylonjs'

const BELOW_GROUND = {
  position: new Vector3(0, -10, 0),
  quat: new Quaternion(),
}

interface ControllerState {
  position: Vector3
  quat: Quaternion
}

class BoardState {
  public calibration: ControllerState

  private controller?: WebVRController
  constructor(
    private controllerOffset: Vector3,
    private boardOffset: Vector3
  ) {}

  registerController(controller: WebVRController) {
    console.log('registerController', controller.hand)
    if (controller.hand === 'left') {
      this.controller = controller
    }
  }

  getBoardState(): ControllerState {
    if (this.controller == null) {
      return BELOW_GROUND
    }
    const quat = this.controller.deviceRotationQuaternion.multiplyInPlace(
      Quaternion.Inverse(this.calibration.quat)
    )

    const position = this.controller.devicePosition
      .add(this.controllerOffset)
      .add(this.boardOffset)

    return {
      quat,
      position,
    }
  }

  calibrate() {
    if (this.controller == null) {
      return
    }
    this.calibration = {
      position: this.controller.devicePosition.clone(),
      quat: this.controller.deviceRotationQuaternion.clone(),
    }
  }
}

export default BoardState
