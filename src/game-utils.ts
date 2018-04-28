import * as BABYLON from 'babylonjs'
import * as GUI from 'babylonjs-gui'

interface LoadModelOptions {
  autoAdd?: boolean
  scale?: number
}

const addLight = (scene: BABYLON.Scene): void => {
  var light = new BABYLON.HemisphericLight(
    'light1',
    new BABYLON.Vector3(0, 1, 0),
    scene
  )
  light.intensity = 0.7
}

const addSkybox = (rootUrl: string, scene: BABYLON.Scene): void => {
  var skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene)
  skyboxMaterial.backFaceCulling = false
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(rootUrl, scene)
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0)
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
  skyboxMaterial.disableLighting = true

  var skybox = BABYLON.Mesh.CreateBox('skyBox', 10000.0, scene)
  skybox.material = skyboxMaterial
}

const loadMesh = (
  rootUrl: string,
  sceneFilename: string,
  scene: BABYLON.Scene,
  autoAdd: boolean = false
): Promise<BABYLON.Mesh> => {
  return BABYLON.SceneLoader.LoadAssetContainerAsync(
    rootUrl,
    sceneFilename,
    scene
  ).then(assetContainer => {
    const mesh = assetContainer.meshes[0] as BABYLON.Mesh
    if (autoAdd) {
      scene.addMesh(mesh)
    }
    return mesh
  })
}

export { addLight, addSkybox, loadMesh }
