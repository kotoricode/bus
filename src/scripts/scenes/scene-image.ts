import { get } from "svelte/store"
import { Mesh, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from "three"
import { ImageCamera } from "../camera/image-camera"
import { rendering } from "../rendering"
import { materialManager } from "../materials/material-manager"
import { storeSettings } from "../state"
import { textureManager } from "../texture-manager"
import type { GameScene } from "../types"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"

let fullScreenQuadMaterial: ShaderMaterial
let scene: Scene
let camera: ImageCamera
const textureId = "scene"

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
    camera = new ImageCamera(canvasSize)

    const fullScreenQuadGeometry = new PlaneGeometry(canvasSize.x, canvasSize.y)
    fullScreenQuadMaterial = materialManager.getMaterial("image")
    fullScreenQuadMaterial.uniforms.map.value = textureManager.getTexture(textureId)
    const fullScreenQuad = new Mesh(fullScreenQuadGeometry, fullScreenQuadMaterial)
    scene.add(fullScreenQuad)

    rendering.setEffects([
        new RenderPass(scene, camera),
        new UnrealBloomPass(resolution, 1.75, 1, 0.5)
    ])
}

const update = (): void =>
{
    fullScreenQuadMaterial.uniforms.map.value = textureManager.getTexture(textureId)
    rendering.renderEffects()
}

export const sceneImage: GameScene = <const>{
    init,
    update
}
