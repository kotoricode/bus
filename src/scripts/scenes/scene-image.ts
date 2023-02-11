import { get } from "svelte/store"
import { Mesh, MeshBasicMaterial, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from "three"
import { ImageCamera } from "../camera/image-camera"
import { rendering } from "../rendering"
import { shaderManager } from "../shaders/shader-manager"
import { storeSettings } from "../state"
import { textureManager } from "../texture-manager"
import type { GameScene } from "../types"

let quadMaterial: ShaderMaterial
let scene: Scene
let imageCamera: ImageCamera

const init = async (): Promise<void> =>
{
    const settings = get(storeSettings)
    const size = new Vector2()

    if (settings.width > settings.height)
    {
        size.set(settings.width / settings.height, 1)
    }
    else
    {
        size.set(1, settings.width / settings.height)
    }

    scene = new Scene()
    imageCamera = new ImageCamera(size)

    const quadGeometry = new PlaneGeometry(size.x, size.y)
    const map = textureManager.getTexture("scene")
    quadMaterial = shaderManager.getImageMaterial()

    console.log(quadMaterial)

    quadMaterial.uniforms.map.value = map

    const quad = new Mesh(quadGeometry, quadMaterial)
    scene.add(quad)
}

const update = (): void =>
{
    quadMaterial.uniforms.map.value = textureManager.getTexture("scene")
    rendering.render(scene, imageCamera.camera)
}

export const sceneImage: GameScene = <const>{
    init,
    update
}
