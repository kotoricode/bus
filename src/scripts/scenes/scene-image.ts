import { get } from "svelte/store"
import { Mesh, MeshBasicMaterial, PlaneGeometry, Scene, Vector2 } from "three"
import { ImageCamera } from "../camera/image-camera"
import { storeHeight, storeWidth } from "../state"
import { taskRender } from "../tasks/task-render"
import { textureManager } from "../texture-manager"
import type { GameScene } from "../types"

let task: () => void
let quadMaterial: MeshBasicMaterial

const init = async (): Promise<void> =>
{
    const scene = new Scene()

    const width = get(storeWidth)
    const height = get(storeHeight)
    const size = new Vector2()

    if (width > height)
    {
        size.set(width / height, 1)
    }
    else
    {
        size.set(1, width / height)
    }

    const camera = new ImageCamera()

    const quadGeometry = new PlaneGeometry(size.x, size.y)
    const map = textureManager.getTexture("scene")

    quadMaterial = new MeshBasicMaterial({
        map
    })

    const quad = new Mesh(quadGeometry, quadMaterial)
    scene.add(quad)

    task = taskRender(scene, camera.camera, "image")
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
