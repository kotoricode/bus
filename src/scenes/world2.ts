import { get } from "svelte/store"
import {
    BoxGeometry, BufferGeometry, Color, DirectionalLight, Line, Line3, LineBasicMaterial, MathUtils,
    Mesh, MeshBasicMaterial, PerspectiveCamera, Plane, PlaneGeometry, Raycaster, Scene, Texture,
    Triangle,
    Vector2, Vector3, WebGLRenderer, WebGLRenderTarget
} from "three"
import { Character } from "../scripts/character"
import { clock } from "../scripts/clock"
import { mouse } from "../scripts/mouse"
import { NavMesh } from "../scripts/navmesh"
import { debugStore, dialogueBranch, settingsHeight, settingsWidth } from "../scripts/state"
import type { GameScene } from "../scripts/types"

type DebugLine = {
    readonly object: Line<BufferGeometry, LineBasicMaterial>
    readonly hueShift: number
    timer: number
    timerActive: boolean
}

let scene: Scene
let camera: PerspectiveCamera
const raycaster = new Raycaster()
const characters = new Map<string, Character>()
let navMesh: NavMesh

const debugLines = new Set<DebugLine>()
const debugLinesInactive = new Set<DebugLine>()

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

    for (const tri of navMesh.triangles)
    {
        const geometry = new BufferGeometry().setFromPoints([tri.a, tri.b, tri.c, tri.a])
        const material = new LineBasicMaterial({
            color: 0xffffff
        })
        const object = new Line(geometry, material)

        debugLinesInactive.add({
            object,
            hueShift: 0,
            timer: 0,
            timerActive: false
        })
    }

    for (const node of navMesh.nodes)
    {
        const geometry = new BoxGeometry(0.2, 0.2, 0.2)
        const material = new MeshBasicMaterial({
            color: 0xff0000
        })
        const object = new Mesh(geometry, material)
        object.position.copy(node)
        scene.add(object)
    }
}

const init = async (): Promise<void> =>
{
    debugLinesInactive.clear()

    scene = new Scene()

    const width = get(settingsWidth)
    const height = get(settingsHeight)

    camera = new PerspectiveCamera(45, width / height, 1, 50)
    camera.position.z = 15
    camera.position.y = 10
    camera.rotation.x = MathUtils.degToRad(-45)

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

    createGround()

    const modelsLoaded = Array
        .from(characters.values())
        .map(character => character.loadMeshPromise)

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
    renderer.render(scene, camera)
}

const update = (): void =>
{
    const dialogue = get(dialogueBranch)

    if (dialogue)
    {
        return
    }

    const click = mouse.getClick()

    if (click)
    {
        const target = new Vector3()

        for (const triangle of navMesh.triangles)
        {
            raycaster.setFromCamera(click, camera)

            const result = raycaster.ray.intersectTriangle(
                triangle.a, triangle.b, triangle.c,
                true, target
            )

            if (result)
            {
                const player = getCharacter("player")
                player.path = [player.mesh.position, result]
            }
        }
    }

    updateModels()
    updateMovement()
    updateRotation()
    updateDebugLines()
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
    const down = new Vector3(0, 0, 1)

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
                character.rotation = sign * down.angleTo(difference)

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
    const multiplier = Math.PI * 2 * deltaTime

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

        const step = Math.sign(diff) * Math.min(multiplier, absDiff)
        let rotation = oldRotation + step

        if (rotation > Math.PI)
        {
            rotation -= Math.PI * 2
        }

        character.mesh.rotation.y = rotation
    }
}

const updateDebugLines = (): void =>
{
    const active = get(debugStore)

    if (active)
    {
        for (const line of debugLinesInactive)
        {
            debugLines.add(line)
            scene.add(line.object)
        }

        debugLinesInactive.clear()
        updateDebugLinesSet(debugLines)
    }
    else
    {
        for (const line of debugLines)
        {
            debugLinesInactive.add(line)
            scene.remove(line.object)
        }

        debugLines.clear()
        updateDebugLinesSet(debugLinesInactive)
    }
}

const updateDebugLinesSet = (set: Set<DebugLine>): void =>
{
    const deltaTime = clock.getDeltaTime()
    const now = Date.now() / 10000

    for (const line of set)
    {
        if (line.timerActive)
        {
            if (line.timer <= deltaTime)
            {
                scene.remove(line.object)
                set.delete(line)

                continue
            }

            line.timer -= deltaTime

            if (line.timer < 1)
            {
                line.object.material.opacity = line.timer
            }
        }

        const time = now + line.hueShift
        line.object.material.color.setHSL(time % 1, 1, 0.85)
    }
}

export const world2: GameScene = <const>{
    init,
    render,
    update
}
