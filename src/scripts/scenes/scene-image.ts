import { get } from "svelte/store"
import { Mesh, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from "three"
import { ImageCamera } from "../camera/image-camera"
import { rendering } from "../rendering"
import { shaderManager } from "../shaders/shader-manager"
import { storeSettings } from "../state"
import { textureManager } from "../texture-manager"
import type { GameScene } from "../types"
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import { time } from "../time"

let fullScreenQuadMaterial: ShaderMaterial
let scene: Scene
let imageCamera: ImageCamera
const textureId = "scene"

let effectComposer: EffectComposer

const init = async (): Promise<void> =>
{
    const settings = get(storeSettings)
    const resolution = new Vector2(settings.width, settings.height)
    const canvasSize = new Vector2(1, 1)
    canvasSize.setComponent(
        settings.width > settings.height ? 0 : 1,
        settings.width / settings.height
    )

    scene = new Scene()
    imageCamera = new ImageCamera(canvasSize)

    const fullScreenQuadGeometry = new PlaneGeometry(canvasSize.x, canvasSize.y)
    fullScreenQuadMaterial = shaderManager.getImageMaterial()
    fullScreenQuadMaterial.uniforms.map.value = textureManager.getTexture(textureId)
    const fullScreenQuad = new Mesh(fullScreenQuadGeometry, fullScreenQuadMaterial)
    scene.add(fullScreenQuad)

    effectComposer = rendering.createEffectComposer()

    const renderPass = new RenderPass(scene, imageCamera.camera)
    const bloomPass = new UnrealBloomPass(resolution, 1.75, 1, 0.5)

    effectComposer.addPass(renderPass)
    effectComposer.addPass(bloomPass)
}

const update = (): void =>
{
    const deltaTime = time.delta()
    fullScreenQuadMaterial.uniforms.map.value = textureManager.getTexture(textureId)
    effectComposer.render(deltaTime)
}

export const sceneImage: GameScene = <const>{
    init,
    update
}
