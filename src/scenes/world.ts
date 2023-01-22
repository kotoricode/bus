import { get } from "svelte/store"
import {
    AmbientLight, BufferGeometry, Color, DirectionalLight, Line, Line3, LineBasicMaterial,
    Mesh, MeshBasicMaterial, Object3D, Raycaster, Scene,
    SphereGeometry,
    Triangle, Vector3, WebGLRenderer, WebGLRenderTarget
} from "three"
import { camera } from "../scripts/camera"
import { Character } from "../scripts/character"
import { clock } from "../scripts/clock"
import { mouse } from "../scripts/mouse"
import { NavMesh } from "../scripts/nav-mesh"
import { debugStore, dialogueBranch, settingsHeight, settingsWidth } from "../scripts/state"
import type { GameScene } from "../scripts/types"

let scene: Scene
const raycaster = new Raycaster()
const characters = new Map<string, Character>()
let navMesh: NavMesh

let debug: Object3D
const waypointObjects: Object3D[] = []

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
            updateModels()
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

    handleClick()
    updateMovement()
    updateRotation()
    updateModels()
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

const updateModels = (): void =>
{
    for (const character of characters.values())
    {
        if (character.pendingMesh)
        {
            scene.remove(character.mesh)
            character.mesh = character.pendingMesh
            character.pendingMesh = null
            scene.add(character.mesh)
        }

        character.updateMeshTransform()
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

const updateMovement = (): void =>
{
    const deltaTime = clock.getDeltaTime()
    const difference = new Vector3()
    const differenceXZ = new Vector3()
    const forward = new Vector3(0, 0, 1)

    for (const character of characters.values())
    {
        let step = deltaTime * character.speed
        let traversed = 0

        for (const waypoint of character.path)
        {
            const distance = character.position.distanceTo(waypoint)

            if (distance)
            {
                difference.copy(waypoint).sub(character.position)
                const sign = Math.sign(difference.x || difference.z)
                differenceXZ.copy(difference).y = 0
                character.targetRotation = sign * forward.angleTo(differenceXZ)

                if (step < distance)
                {
                    const direction = difference.multiplyScalar(step / distance)
                    character.position.add(direction)

                    break
                }

                step -= distance
            }

            character.position.copy(waypoint)
            traversed++
        }

        if (traversed)
        {
            character.path.splice(0, traversed)
        }
    }
}

const updateRotation = (): void =>
{
    const deltaTime = clock.getDeltaTime()
    const turnBase = 0.7
    const turnDiffModifier = 3.8

    for (const character of characters.values())
    {
        let oldRotation = character.rotation
        let newRotation = character.targetRotation

        if (oldRotation === newRotation)
        {
            continue
        }

        let diff = newRotation - oldRotation
        let absDiff = Math.abs(diff)

        if (absDiff > Math.PI)
        {
            if (newRotation < 0)
            {
                newRotation += Math.PI * 2
            }
            else
            {
                oldRotation += Math.PI * 2
            }

            diff = newRotation - oldRotation
            absDiff = Math.abs(diff)
        }

        const turn = (turnBase + absDiff * turnDiffModifier) * deltaTime

        const step = Math.sign(diff) * Math.min(turn, absDiff)
        let rotation = oldRotation + step

        if (rotation > Math.PI)
        {
            rotation -= Math.PI * 2
        }

        character.rotation = rotation
    }
}

export const world: GameScene = <const>{
    init,
    render,
    update
}
