import { get } from "svelte/store"
import {
    BoxGeometry, BufferGeometry, Line, Line3, LineBasicMaterial, MeshBasicMaterial,
    PerspectiveCamera, Plane, Raycaster, Scene, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget
} from "three"
import { Character } from "../scripts/character"
import { clock } from "../scripts/clock"
import { model } from "../scripts/model"
import { mouse } from "../scripts/mouse"
import { pathing } from "../scripts/pathing"
import { Polygon } from "../scripts/polygon"
import { debugStore, dialogueBranch, settingsHeight, settingsWidth } from "../scripts/state"
import type { GameScene } from "../scripts/types"

class DebugLine
{
    inScene: boolean

    constructor(
        public readonly object: Line<BufferGeometry, LineBasicMaterial>,
        public timer: number,
        public timerActive: boolean,
        public readonly hueShift: number
    )
    {
        this.inScene = false
    }
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

const init = (): void =>
{
    scene = new Scene()

    const width = get(settingsWidth)
    const height = get(settingsHeight)

    camera = new PerspectiveCamera(45, width / height, 1, 50)
    camera.position.z = 15
    camera.position.y = 10
    camera.rotation.x = -45 * Math.PI / 180

    model.get("hall").then((data) =>
    {
        //scene.add(data.scene)
    })

    const player = new Character(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({ color: 0x00ff00 }),
        5
    )

    characters.push(player)
    scene.add(player.mesh)

    {
        const material = new LineBasicMaterial( { color: 0xffffff } )

        points.push(
            new Vector3(-5, 0, 0),
            new Vector3(-5, 0, 5),
            new Vector3(-2, 0, 5),
            new Vector3(-2, 0, 7),
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
        debugLines.add(new DebugLine(line, 0, false, 0))
    }

    ground = new Polygon(points, true)

    debugStore.subscribe(value =>
    {
        for (const line of debugLines)
        {
            line.inScene = value

            if (value)
            {
                scene.add(line.object)
            }
            else
            {
                scene.remove(line.object)
            }
        }
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
        updateClick(click)
    }

    updateMovement()
    updateDebugLines()
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
            debugLines.add(new DebugLine(line, 5, true, 0.5))
        }
    }
}

const updateMovement = (): void =>
{
    const deltaTime = clock.getDeltaTime()
    const angleBase = new Vector3
    const difference = new Vector3

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
                angleBase.z = difference.x
                character.mesh.rotation.y = angleBase.angleTo(difference)

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
    const deltaTime = clock.getDeltaTime()

    for (const line of debugLines)
    {
        if (active && !line.inScene)
        {
            scene.add(line.object)
            line.inScene = true
        }

        if (line.timerActive)
        {
            line.timer -= deltaTime

            if (line.timer <= 0)
            {
                scene.remove(line.object)
                debugLines.delete(line)
            }
            else if (line.timer < 1)
            {
                line.object.material.opacity = line.timer
            }
        }

        const time = Date.now() / 10000 + line.hueShift
        line.object.material.color.setHSL(time % 1, 1, 0.85)
    }
}

export const world: GameScene = <const>{
    init,
    render,
    update
}
