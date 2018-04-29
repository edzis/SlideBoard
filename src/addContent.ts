import {
  Scene,
  Mesh,
  MeshBuilder,
  Color4,
  StandardMaterial,
  Color3,
  CubeTexture,
  MultiMaterial,
  Texture,
  HemisphericLight,
  Vector3,
  SubMesh,
  DirectionalLight,
  PhysicsImpostor,
  Light,
  SpotLight,
  SceneLoader,
  TerrainMaterial,
  TransformNode,
} from 'babylonjs'
import { mapValues } from 'lodash'

const sceneBounds = {
  depth: 1000,
  width: 1000,
  height: 1000,
}

const BOARD_HEIGHT = 0.12
const USER_HEIGHT = 1.7

const addLight = (scene: Scene): Light => {
  var light = new DirectionalLight('light1', new Vector3(0, -1, 0), scene)
  // var light = new SpotLight(
  //   'light1',
  //   new Vector3(0, 0, 0),
  //   new Vector3(0, 0, 1),
  //   1,
  //   2,
  //   scene
  // )
  light.intensity = 0.7
  return light
}

const addSkybox = (rootUrl: string, scene: Scene): Mesh => {
  var skyboxMaterial = new StandardMaterial('skyBox', scene)
  skyboxMaterial.backFaceCulling = false
  skyboxMaterial.reflectionTexture = new CubeTexture(rootUrl, scene)
  skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE
  skyboxMaterial.diffuseColor = new Color3(0, 0, 0)
  skyboxMaterial.specularColor = new Color3(0, 0, 0)
  skyboxMaterial.disableLighting = true

  var skybox = MeshBuilder.CreateBox(
    'skyBox',
    mapValues(sceneBounds, x => x * 10),
    scene
  )
  skybox.material = skyboxMaterial

  return skybox
}

const addGround = (scene: Scene): Mesh => {
  const ground = MeshBuilder.CreateGround(
    'Tiled Ground',
    {
      width: sceneBounds.width,
      height: sceneBounds.depth,
    },
    scene
  )

  // Create terrain material
  var terrainMaterial = new TerrainMaterial('terrainMaterial', scene)
  terrainMaterial.specularColor = new Color3(0.5, 0.5, 0.5)
  terrainMaterial.specularPower = 64

  // Set the mix texture (represents the RGB values)
  terrainMaterial.mixTexture = new Texture('/assets/mixMap.png', scene)

  // Diffuse textures following the RGB values of the mix map
  // diffuseTexture1: Red
  // diffuseTexture2: Green
  // diffuseTexture3: Blue
  terrainMaterial.diffuseTexture1 = new Texture('/assets/floor.png', scene)
  terrainMaterial.diffuseTexture2 = new Texture('/assets/rock.png', scene)
  terrainMaterial.diffuseTexture3 = new Texture('/assets/grass.png', scene)

  // Bump textures according to the previously set diffuse textures
  terrainMaterial.bumpTexture1 = new Texture('/assets/floor_bump.png', scene)
  terrainMaterial.bumpTexture2 = new Texture('/assets/rockn.png', scene)
  terrainMaterial.bumpTexture3 = new Texture('/assets/grassn.png', scene)

  // Rescale textures according to the terrain
  terrainMaterial.diffuseTexture1.uScale = terrainMaterial.diffuseTexture1.vScale = 100
  terrainMaterial.diffuseTexture2.uScale = terrainMaterial.diffuseTexture2.vScale = 100
  terrainMaterial.diffuseTexture3.uScale = terrainMaterial.diffuseTexture3.vScale = 100

  ground.material = terrainMaterial

  return ground
}

const loadMesh = (
  rootUrl: string,
  sceneFilename: string,
  scene: Scene,
  autoAdd: boolean = false
): Promise<Mesh> => {
  return SceneLoader.LoadAssetContainerAsync(
    rootUrl,
    sceneFilename,
    scene
  ).then(assetContainer => {
    const mesh = assetContainer.meshes[0] as Mesh
    if (autoAdd) {
      scene.addMesh(mesh)
    }
    return mesh
  })
}

const addContent = async (scene: Scene): Promise<SceneContent> => {
  console.log('addContent')

  // await loadMesh('/assets/skateboard/', 'CUPIC_SKATEBOARD.obj', scene)
  // console.log('loadMesh done')

  const red = new Color4(128, 0, 0, 0.1)
  const blue = new Color4(0, 0, 128)
  const green = new Color4(0, 0, 128, 0.2)

  const newWorldCenter = MeshBuilder.CreateBox(
    'initial-board-axis',
    {
      width: 0.01,
      depth: 0.8,
      height: 0.01,
      faceColors: [blue, blue, blue, blue, blue, blue],
    },
    scene
  )
  newWorldCenter.isVisible = false

  const boardSurface = MeshBuilder.CreateBox(
    'board-surface',
    {
      width: 0.4,
      depth: 0.8,
      height: 0.02,
      faceColors: [red, red, red, red, red, red],
    },
    scene
  )
  // boardSurface.isVisible = false

  const human = new TransformNode('human', scene)
  human.parent = boardSurface
  human.rotation.y = Math.PI / 2

  const humanBody = MeshBuilder.CreateBox(
    'human',
    {
      width: 0.3,
      height: USER_HEIGHT,
      depth: 0.2,
      faceColors: [green, green, green, green, green, green],
    },
    scene
  )
  humanBody.parent = human
  humanBody.position.y = USER_HEIGHT / 2
  humanBody.isVisible = false

  const headContainer = new TransformNode('head-container')
  headContainer.parent = human
  headContainer.position.y = USER_HEIGHT

  const ground = addGround(scene)
  ground.parent = newWorldCenter
  ground.parent = newWorldCenter
  const skyBox = addSkybox('/assets/skybox/skybox', scene)
  const light = addLight(scene)

  return {
    ground,
    skyBox,
    light,
    newWorldCenter,
    boardSurface,
    human,
    humanBody,
    headContainer,
  }
}

export interface SceneContent {
  newWorldCenter: Mesh
  boardSurface: Mesh
  human: TransformNode
  humanBody: Mesh
  headContainer: TransformNode
  ground: Mesh
  skyBox: Mesh
  light: Light
}

export default addContent
