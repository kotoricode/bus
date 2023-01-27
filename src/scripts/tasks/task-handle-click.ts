import {
    BufferGeometry, Line, Line3, LineBasicMaterial, Mesh, MeshBasicMaterial, Object3D, Raycaster,
    SphereGeometry, Vector3
} from "three"
import type { WorldCamera } from "../camera/world-camera"
import type { Character } from "../character"
import type { EntityManager } from "../entity-manager"
import { mouse } from "../mouse"
import type { NavMesh } from "../nav-mesh"
import { GameTask } from "./game-task"

export class TaskHandleClick extends GameTask
{
    private readonly raycaster = new Raycaster()
    private readonly debugWaypointGeometry = new SphereGeometry(0.15)
    private readonly debugWaypointMaterial = new MeshBasicMaterial({ color: 0x99ff00 })
    private readonly debugPathMaterial = new LineBasicMaterial({ color: 0x00ff00 })

    constructor(
        private readonly entityManager: EntityManager,
        private readonly camera: WorldCamera,
        private readonly navMesh: NavMesh,
        private readonly player: Character
    )
    {
        super()
    }

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

        this.addDebug(path)
    }

    private addDebug(path: Readonly<Vector3[]>): void
    {
        if (this.entityManager.has("debug-path"))
        {
            this.entityManager.remove("debug-path")
        }

        const debugPath = new Object3D()

        for (const waypoint of path)
        {
            const object = new Mesh(this.debugWaypointGeometry, this.debugWaypointMaterial)
            object.position.copy(waypoint)
            debugPath.add(object)
        }

        {
            const geometry = new BufferGeometry().setFromPoints(path.slice())
            const object = new Line(geometry, this.debugPathMaterial)
            debugPath.add(object)
        }

        this.entityManager.add("debug-path", "debug", debugPath)
    }
}
