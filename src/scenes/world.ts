import { get } from "svelte/store"
import {
    BoxGeometry, BufferGeometry, Color, DirectionalLight, Line, Line3, LineBasicMaterial,
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
    const a = new Triangle(
        new Vector3(0, 0, -1),
        new Vector3(-3, 0, 6),
        new Vector3(3, 0, 6)
    )

    const b = new Triangle(
        new Vector3(0, 0, -1),
        new Vector3(3, 0, 6),
        new Vector3(5, 0, -5),
    )

    const c = new Triangle(
        new Vector3(5, 0, -5),
        new Vector3(3, 0, 6),
        new Vector3(5, 0, 10),
    )

    const d = new Triangle(
        new Vector3(3, 0, 6),
        new Vector3(-3, 0, 6),
        new Vector3(5, 0, 10),
    )

    const e = new Triangle(
        new Vector3(0, 0, -1),
        new Vector3(-6, 0, -5),
        new Vector3(-3, 0, 6),
    )

    navMesh = new NavMesh([a, b, c, d, e])

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

    const player = new Character(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({
            color: 0x00ff00
        }),
        3
    )

    const light = new DirectionalLight(new Color(1, 1, 1))
    scene.add(light)

    characters.set("player", player)
    camera.jumpTo(player.mesh.position)
    camera.track(player)

    createGround()

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
    updateModels()
    updateMovement()
    updateRotation()
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

    const result = navMesh.getIntersection(raycaster)

    if (!result)
    {
        return
    }

    const player = getCharacter("player")
    const segment = new Line3(player.mesh.position, result)
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
        if (character.meshNeedsUpdating)
        {
            scene.remove(character.placeholder)
            scene.add(character.mesh)
            character.meshNeedsUpdating = false
        }
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
            const distance = character.mesh.position.distanceTo(waypoint)

            if (distance)
            {
                difference.copy(waypoint).sub(character.mesh.position)
                const sign = Math.sign(difference.x)
                differenceXZ.copy(difference).y = 0
                character.rotation = sign * forward.angleTo(differenceXZ)

                if (step < distance)
                {
                    const direction = difference.multiplyScalar(step / distance)
                    character.mesh.position.add(direction)

                    break
                }

                step -= distance
            }

            character.mesh.position.copy(waypoint)
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
        let oldRotation = character.mesh.rotation.y
        let newRotation = character.rotation

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

        character.mesh.rotation.y = rotation
    }
}

export const world: GameScene = <const>{
    init,
    render,
    update
}
