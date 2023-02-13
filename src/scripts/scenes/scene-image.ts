import { get } from "svelte/store"
import { Mesh, PlaneGeometry, Scene, Vector2 } from "three"
import { ImageCamera } from "../camera/image-camera"
import { rendering } from "../rendering"
import { materialManager } from "../materials/material-manager"
import { storeSettings } from "../state"
import { textureManager } from "../texture-manager"
import type { Disposable, GameScene } from "../types"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"

const textureId = "scene"

export const createImageScene = (): GameScene =>
{
    const fullScreenQuadMaterial= materialManager.getMaterial("image")
    const scene = new Scene()
    const disposables: Disposable[] = []

    const settings = get(storeSettings)
    const resolution = new Vector2(settings.width, settings.height)
    const canvasSize = new Vector2(1, 1)
    canvasSize.setComponent(
        settings.width > settings.height ? 0 : 1,
        settings.width / settings.height
    )

    const camera = new ImageCamera(canvasSize)

    const fullScreenQuadGeometry = new PlaneGeometry(canvasSize.x, canvasSize.y)
    fullScreenQuadMaterial.uniforms.map.value = textureManager.getTexture(textureId)
    const fullScreenQuad = new Mesh(fullScreenQuadGeometry, fullScreenQuadMaterial)
    scene.add(fullScreenQuad)

    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(resolution, 1.75, 1, 0.5)

    rendering.setEffects([renderPass, bloomPass])

    disposables.push(
        fullScreenQuadGeometry,
        fullScreenQuadMaterial,
        renderPass,
        bloomPass
    )

    const dispose = (): void =>
    {
        for (const disposable of disposables)
        {
            disposable.dispose()
        }
    }

    const update = (): void =>
    {
        fullScreenQuadMaterial.uniforms.map.value = textureManager.getTexture(textureId)
        rendering.renderEffects()
    }

    return <const>{
        dispose,
        update
    }
}
