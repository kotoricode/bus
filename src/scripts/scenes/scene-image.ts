import { get } from "svelte/store"
import { Mesh, MeshBasicMaterial, PlaneGeometry, Scene, Vector2 } from "three"
import { ImageCamera } from "../camera/image-camera"
import type { GameTask } from "../tasks/game-task"
import { storeHeight, storeWidth } from "../state"
import { TaskRender } from "../tasks/task-render"
import { textureManager } from "../texture"
import type { GameScene } from "../types"

let taskRender: GameTask
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

    taskRender = new TaskRender(scene, camera.camera, "image")
}

const update = (): void =>
{
    quadMaterial.map = textureManager.getTexture("scene")
    taskRender.run()
}

export const sceneImage: GameScene = <const>{
    init,
    update
}
