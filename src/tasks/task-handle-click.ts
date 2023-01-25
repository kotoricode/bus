import { Line3, Raycaster } from "three"
import type { GameCamera } from "../scripts/camera"
import type { Character } from "../scripts/character"
import { mouse } from "../scripts/mouse"
import type { NavMesh } from "../scripts/nav-mesh"
import type { GameTask } from "./task"

export class TaskHandleClick implements GameTask
{
    private readonly raycaster = new Raycaster()

    constructor(
        private readonly camera: GameCamera,
        private readonly navMesh: NavMesh,
        private readonly player: Character
    )
    {}

    run(): void
    {
        const click = mouse.getClick()

        if (!click)
        {
            return
        }

        this.raycaster.setFromCamera(click, this.camera.camera)

        const intersection = this.navMesh.getGridIntersection(this.raycaster)

        if (!intersection)
        {
            return
        }

        const segment = new Line3(this.player.position, intersection.point)
        const path = this.navMesh.getPath(segment)

        if (!path)
        {
            return
        }

        this.player.path = path
        // debug.remove(...waypointObjects)

        // for (const wp of path)
        // {
        //     const geometry = new SphereGeometry(0.15)
        //     const material = new MeshBasicMaterial({
        //         color: 0x99ff00
        //     })
        //     const object = new Mesh(geometry, material)
        //     object.position.copy(wp)
        //     debug.add(object)
        //     waypointObjects.push(object)
        // }

        // for (let i = 0; i < path.length - 1; i++)
        // {
        //     const wp1 = path[i]
        //     const wp2 = path[i + 1]
        //     const geometry = new BufferGeometry().setFromPoints([wp1, wp2])
        //     const material = new LineBasicMaterial({
        //         color: 0x00ff00
        //     })
        //     const object = new Line(geometry, material)
        //     debug.add(object)
        //     waypointObjects.push(object)
        // }
    }
}
