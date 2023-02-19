import { get } from "svelte/store"
import { Mesh, PlaneGeometry, Scene, Vector2 } from "three"
import { ImageCamera } from "../camera/image-camera"
import { rendering } from "../rendering"
import { materialManager } from "../materials/material-manager"
import { store } from "../store"
import { textureManager } from "../texture-manager"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import type { GameScene } from "../types"

const textureId = "textureScene"

export const sceneImage = (): GameScene =>
{
    const fullScreenQuadMaterial = materialManager.getMaterial("materialImage")
    const scene = new Scene()

    const settings = get(store.settings)
    const resolution = new Vector2(settings.width, settings.height)
    const canvasSize = new Vector2(1, 1)
    canvasSize.setComponent(
        settings.width > settings.height ? 0 : 1,
        settings.width / settings.height
    )

    const camera = new ImageCamera(canvasSize)

    const fullScreenQuadGeometry = new PlaneGeometry(canvasSize.x, canvasSize.y)
    const fullScreenQuad = new Mesh(fullScreenQuadGeometry, fullScreenQuadMaterial)
    scene.add(fullScreenQuad)

    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(resolution, 1.75, 1, 0.5)

    rendering.setEffects(renderPass, bloomPass)

    const update = (): void =>
    {
        const texture = textureManager.getNamedTexture(textureId)

        if (fullScreenQuadMaterial.uniforms.map.value !== texture)
        {
            fullScreenQuadMaterial.uniforms.map.value = texture
        }

        rendering.renderEffects()
    }

    return <const>{
        scene,
        update
    }
}
