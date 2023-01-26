import { get } from "svelte/store"
import { AmbientLight, Color, DirectionalLight, Object3D, Scene, Triangle, Vector3 } from "three"
import { eventManager } from "../events/event-manager"
import { SceneCamera } from "../scene-camera"
import { Character } from "../character"
import { NavMesh } from "../nav-mesh"
import { debugStore, dialogueBranch } from "../state"
import type { GameTask } from "../interfaces"
import { TaskHandleClick } from "../tasks/task-handle-click"
import { TaskRender } from "../tasks/task-render"
import { TaskUpdateCamera } from "../tasks/task-update-camera"
import { TaskUpdateModels } from "../tasks/task-update-models"
import { TaskUpdateTransform } from "../tasks/task-update-transform"

const characters = new Map<string, Character>()
let debug: Object3D
let tasks: GameTask[]

const createGround = (): NavMesh =>
{
    const x = 4

    const test: Vector3[] = Array((x + 1) ** 2)
        .fill(0)
        .map((_, i) => new Vector3(
            i % (x + 1) * 2,
            0,
            (i / (x + 1) | 0) * 2
        ))

    const triangles = []

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

    for (const debugObject of navMesh.getGridDebugObjects())
    {
        debug.add(debugObject)
    }

    return navMesh
}

const init = async (): Promise<void> =>
{
    const scene = new Scene()
    debug = new Object3D()

    const camera = new SceneCamera(new Vector3(0, 12, 12))

    scene.add(debug)
    const player = new Character("monkey", 3)

    characters.set("player", player)
    camera.jumpTo(player.position)
    camera.track(player)

    const navMesh = createGround()
    createLights(scene)

    tasks = [
        new TaskHandleClick(camera, navMesh, player),
        new TaskUpdateTransform(characters),
        new TaskUpdateModels(scene, characters),
        new TaskUpdateCamera(camera),
        new TaskRender("scene", scene, camera)
    ]

    const modelsLoaded = Array
        .from(characters.values())
        .map(character => character.loadMeshPromise)

    debugStore.subscribe(value =>
    {
        if (value)
        {
            if (!debug.parent)
            {
                scene.add(debug)
            }
        }
        else if (debug.parent)
        {
            scene.remove(debug)
        }
    })

    return new Promise(resolve =>
    {
        Promise.all(modelsLoaded).then(() =>
        {
            resolve()
        })
    })
}

const createLights = (scene: Scene): void =>
{
    const light = new DirectionalLight(new Color(1, 1, 1))
    scene.add(light)

    const ambientLight = new AmbientLight(new Color(0, 0, 0.075))
    scene.add(ambientLight)
}

const update = (): void =>
{
    const dialogue = get(dialogueBranch)

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
        task.run()
    }
}

export const sceneWorld = <const>{
    init,
    update
}
