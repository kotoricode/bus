import { get } from "svelte/store"
import {
    BoxGeometry, BufferGeometry, Color, DirectionalLight, Line, Line3,
    LineBasicMaterial, MathUtils, MeshBasicMaterial, PerspectiveCamera, Plane,
    Raycaster, Scene, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget
} from "three"
import { Character } from "../scripts/character"
import { clock } from "../scripts/clock"
import { mouse } from "../scripts/mouse"
import { pathing } from "../scripts/pathing"
import { Polygon } from "../scripts/polygon"
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
const raycaster = new Raycaster
const characters: Character[] = []
const planeNormal = new Vector3(0, 1, 0)
const plane = new Plane(planeNormal)
const points: Vector3[] = []
let ground: Polygon

const debugLines = new Set<DebugLine>()
const debugLinesInactive = new Set<DebugLine>()

const init = async (): Promise<void> =>
{
    scene = new Scene()

    const width = get(settingsWidth)
    const height = get(settingsHeight)

    camera = new PerspectiveCamera(45, width / height, 1, 50)
    camera.position.z = 15
    camera.position.y = 10
    camera.rotation.x = -45 * Math.PI / 180

    const player = new Character(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({ color: 0x00ff00 }),
        1
    )

    const light = new DirectionalLight(new Color(1, 1, 1))
    scene.add(light)

    characters.push(player)
    scene.add(player.mesh)

    {
        const material = new LineBasicMaterial( { color: 0xffffff } )

        points.push(
            new Vector3(-5, 0, 0),
            new Vector3(-5, 0, 5),
            new Vector3(-2, 0, 2),
            new Vector3(-6, 0, 7),
            new Vector3(2,  0, 7),
            new Vector3(2,  0, 5),
            new Vector3(5,  0, 5),
            new Vector3(5,  0, 0),
            new Vector3(2,  0, 0),
            new Vector3(2,  0, -2),
            new Vector3(-2,  0, -2),
            new Vector3(-2,  0, 0),
        )

        const geometry = new BufferGeometry().setFromPoints([...points, points[0]])
        const line = new Line(geometry, material)
        debugLinesInactive.add({
            object: line,
            hueShift: 0,
            timer: 0,
            timerActive: false
        })
    }

    ground = new Polygon(points, true)
    pathing.test()
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
        updateClick(click)
    }

    updateModels()
    updateMovement()
    updateDebugLines()
}

const updateModels = (): void =>
{
    for (const character of characters)
    {
        if (character.newMesh)
        {
            scene.remove(character.mesh)
            character.mesh = character.newMesh
            character.newMesh = null
            scene.add(character.mesh)
        }
    }
}

const updateClick = (click: Vector2): void =>
{
    raycaster.setFromCamera(click, camera)
    const target = new Vector3
    raycaster.ray.intersectPlane(plane, target)

    const entered = pathing.getTargetValid(target, ground, [])

    if (entered)
    {
        pathing.buildGlobalWaypoints(ground, [])
        characters[0].path = pathing.getPath(
            new Line3(characters[0].mesh.position.clone(), target),
            ground,
            []
        )

        for (let i = 0; i < characters[0].path.length - 1; i++)
        {
            const lineGeometry = new BufferGeometry().setFromPoints([
                characters[0].path[i],
                characters[0].path[i + 1]
            ])

            const lineMaterial = new LineBasicMaterial({
                transparent: true
            })

            const line = new Line(lineGeometry, lineMaterial)
            debugLinesInactive.add({
                object: line,
                hueShift: 0.5,
                timer: 5,
                timerActive: true
            })
        }
    }
}

const updateMovement = (): void =>
{
    const deltaTime = clock.getDeltaTime()
    const difference = new Vector3
    const down = new Vector3(0, 0, 1)

    for (const character of characters)
    {
        let step = deltaTime * character.speed
        let i = 0

        for (const target of character.path)
        {
            difference.copy(target).sub(character.mesh.position)
            const distance = character.mesh.position.distanceTo(target)

            if (distance)
            {
                let oldRotation = character.mesh.rotation.y
                let newRotation = Math.sign(difference.x) * down.angleTo(difference)
                const rotationDifference = newRotation - oldRotation

                if (Math.abs(rotationDifference) > Math.PI)
                {
                    if (newRotation < 0)
                    {
                        newRotation += Math.PI * 2
                    }
                    else
                    {
                        oldRotation += Math.PI * 2
                    }

                    const rotation = MathUtils.lerp(oldRotation, newRotation, 0.1)

                    if (rotation < Math.PI)
                    {
                        character.mesh.rotation.y = rotation
                    }
                    else
                    {
                        character.mesh.rotation.y = rotation - Math.PI * 2
                    }
                }
                else
                {
                    character.mesh.rotation.y += rotationDifference * 0.1
                }

                if (step < distance)
                {
                    const direction = difference.multiplyScalar(step / distance)
                    character.mesh.position.add(direction)

                    break
                }

                step -= distance
            }

            character.mesh.position.copy(target)
            i++
        }

        if (i)
        {
            character.path.splice(0, i)
        }
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

export const world: GameScene = <const>{
    init,
    render,
    update
}
