import { get } from "svelte/store"
import {
    AmbientLight, BufferGeometry, Color, DirectionalLight, Line, Line3, LineBasicMaterial,
    Mesh, MeshBasicMaterial, Object3D, Raycaster, Scene,
    SphereGeometry,
    Triangle, Vector3, WebGLRenderer, WebGLRenderTarget
} from "three"
import { eventManager } from "../events/event-manager"
import { camera } from "../scripts/camera"
import { Character } from "../scripts/character"
import { mouse } from "../scripts/mouse"
import { NavMesh } from "../scripts/nav-mesh"
import { debugStore, dialogueBranch, settingsHeight, settingsWidth } from "../scripts/state"
import type { GameScene } from "../scripts/types"
import type { GameTask } from "../tasks/task"
import { TaskUpdateModels } from "../tasks/task-update-models"
import { TaskUpdateTransform } from "../tasks/task-update-transform"

let scene: Scene
const raycaster = new Raycaster()
const characters = new Map<string, Character>()
let navMesh: NavMesh

let debug: Object3D
const waypointObjects: Object3D[] = []
let tasks: GameTask[]

const createGround = (): void =>
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

    navMesh = new NavMesh(triangles)

    for (const debugObject of navMesh.getGridDebugObjects())
    {
        debug.add(debugObject)
    }
}

const init = async (): Promise<void> =>
{
    scene = new Scene()
    debug = new Object3D()
    tasks = [
        new TaskUpdateTransform(characters),
        new TaskUpdateModels(scene, characters)
    ]

    scene.add(debug)

    const width = get(settingsWidth)
    const height = get(settingsHeight)
    const aspectRatio = width / height
    camera.init(aspectRatio)

    const player = new Character("monkey", 3)

    characters.set("player", player)
    camera.jumpTo(player.position)
    camera.track(player)

    createGround()
    createLights()

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

const createLights = (): void =>
{
    const light = new DirectionalLight(new Color(1, 1, 1))
    scene.add(light)

    const ambientLight = new AmbientLight(new Color(0, 0, 0.075))
    scene.add(ambientLight)
}

const render = (renderer: WebGLRenderer, renderTarget: WebGLRenderTarget | null): void =>
{
    renderer.setRenderTarget(renderTarget)
    const sceneCamera = camera.getSceneCamera()
    renderer.render(scene, sceneCamera)
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
    else
    {
        handleClick()
    }

    for (const task of tasks)
    {
        task.run()
    }

    camera.update()
}

const handleClick = (): void =>
{
    const click = mouse.getClick()

    if (!click)
    {
        return
    }

    const sceneCamera = camera.getSceneCamera()
    raycaster.setFromCamera(click, sceneCamera)

    const intersection = navMesh.getGridIntersection(raycaster)

    if (!intersection)
    {
        return
    }

    const player = getCharacter("player")
    const segment = new Line3(player.position, intersection.point)
    const path = navMesh.getPath(segment)

    if (!path)
    {
        return
    }

    player.path = path
    debug.remove(...waypointObjects)

    for (const wp of path)
    {
        const geometry = new SphereGeometry(0.15)
        const material = new MeshBasicMaterial({
            color: 0x99ff00
        })
        const object = new Mesh(geometry, material)
        object.position.copy(wp)
        debug.add(object)
        waypointObjects.push(object)
    }

    for (let i = 0; i < path.length - 1; i++)
    {
        const wp1 = path[i]
        const wp2 = path[i + 1]
        const geometry = new BufferGeometry().setFromPoints([wp1, wp2])
        const material = new LineBasicMaterial({
            color: 0x00ff00
        })
        const object = new Line(geometry, material)
        debug.add(object)
        waypointObjects.push(object)
    }
}

const getCharacter = (name: string): Character =>
{
    const character = characters.get(name)

    if (!character)
    {
        throw Error
    }

    return character
}

export const world: GameScene = <const>{
    init,
    render,
    update
}
