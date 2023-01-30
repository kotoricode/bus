import { get } from "svelte/store"
import { AmbientLight, Color, DirectionalLight, Scene, Triangle, Vector3 } from "three"
import { eventManager } from "../events/event-manager"
import { WorldCamera } from "../camera/world-camera"
import { Entity } from "../entity"
import { NavMesh } from "../nav-mesh"
import { storeDialogue } from "../state"
import type { GameScene } from "../types"
import { EntityManager } from "../entity-manager"
import { modelManager } from "../model-manager"
import { ComponentMovement } from "../components/component-movement"
import { taskUpdateCamera } from "../tasks/task-update-camera"
import { taskHandleClick } from "../tasks/task-handle-click"
import { taskUpdateTransforms } from "../tasks/task-update-transforms"
import { taskRender } from "../tasks/task-render"

let tasks: (() => void)[] = []

const createGround = (entityManager: EntityManager): NavMesh =>
{
    const x = 4
    const triangles = []

    const test: Vector3[] = Array((x + 1) ** 2)
        .fill(0)
        .map((_, i) => new Vector3(
            i % (x + 1),
            0,
            i / (x + 1) | 0
        ))

    for (let i = 0; i < 2 * x ** 2; i++)
    {
        if (i > 9 && i < 16 || i === 18 || i === 22 || i === 27)
        {
            continue
        }

        let triangle: Triangle

        if (i % 2)
        {
            const tl = (i / 2 | 0) + (i / (2 * x) | 0) % x
            const bl = tl + x + 1
            const tr = tl + 1
            const br = bl + 1

            triangle = new Triangle(
                test[tr],
                test[bl],
                test[br]
            )
        }
        else
        {

            const tl = (i / 2 | 0) + (i / (2 * x) | 0) % x
            const bl = tl + x + 1
            const tr = tl + 1

            triangle = new Triangle(
                test[tl],
                test[bl],
                test[tr]
            )
        }

        triangles.push(triangle)
    }

    const navMesh = new NavMesh(triangles)
    const debugObject = navMesh.getGridDebugEntity()
    entityManager.add("debug-grid", "debug", debugObject)

    return navMesh
}

const init = async (): Promise<void> =>
{
    const scene = new Scene()
    const root = new Entity()
    scene.add(root)
    const entityManager = new EntityManager(root)

    const player = new Entity()
    const movement = new ComponentMovement(1.55)
    player.addComponents(movement)
    entityManager.add("player", "root", player)

    const camera = new WorldCamera(new Vector3(0, 5.8, 5.8))
    camera.jumpTo(player.position)
    camera.track(player)

    const navMesh = createGround(entityManager)
    createLights(scene)

    tasks = [
        taskHandleClick(entityManager, camera, navMesh, player),
        taskUpdateTransforms(entityManager),
        taskUpdateCamera(camera),
        taskRender(scene, camera.camera, "scene")
    ]

    const modelsLoaded = [
        modelManager.load(player, "monkey")
    ]

    return Promise.all(modelsLoaded).then()
}

const createLights = (scene: Scene): void =>
{
    const light = new DirectionalLight(new Color(1, 1, 1))
    scene.add(light)

    const ambientLight = new AmbientLight(new Color(0.05, 0.05, 0.1))
    scene.add(ambientLight)
}

const update = (): void =>
{
    const dialogue = get(storeDialogue)

    if (dialogue)
    {
        return
    }

    if (eventManager.active())
    {
        eventManager.update()
    }

    for (const task of tasks)
    {
        task()
    }
}

export const sceneWorld: GameScene = <const>{
    init,
    update
}
