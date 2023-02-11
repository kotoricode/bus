import { get } from "svelte/store"
import { Mesh, MeshBasicMaterial, PlaneGeometry, Scene, Vector2 } from "three"
import { ImageCamera } from "../camera/image-camera"
import { storeSettings } from "../state"
import { taskRender } from "../tasks/task-render"
import { textureManager } from "../texture-manager"
import type { GameScene } from "../types"

let task: () => void
let quadMaterial: MeshBasicMaterial

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

    const imageCamera = new ImageCamera(size)

    const scene = new Scene()
    const quadGeometry = new PlaneGeometry(size.x, size.y)
    const map = textureManager.getTexture("scene")
    quadMaterial = new MeshBasicMaterial({ map })

    const quad = new Mesh(quadGeometry, quadMaterial)
    scene.add(quad)
    task = taskRender(scene, imageCamera.camera)
}

const update = (): void =>
{
    quadMaterial.map = textureManager.getTexture("scene")
    task()
}

export const sceneImage: GameScene = <const>{
    init,
    update
}
