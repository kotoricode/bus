import {
    BufferGeometry, Line, Line3, LineBasicMaterial, Mesh, MeshBasicMaterial, Raycaster,
    SphereGeometry, Vector3
} from "three"
import type { WorldCamera } from "../camera/world-camera"
import { ComponentMovement } from "../components/component-movement"
import { Entity } from "../entity"
import type { EntityManager } from "../entity-manager"
import { mouse } from "../mouse"
import type { NavMesh } from "../nav-mesh"

export const taskHandleClick = (
    entityManager: EntityManager,
    camera: WorldCamera,
    navMesh: NavMesh,
    player: Entity
): () => void =>
{
    const raycaster = new Raycaster()
    const debugWaypointGeometry = new SphereGeometry(0.15)
    const debugWaypointMaterial = new MeshBasicMaterial({ color: 0x99ff00 })
    const debugPathMaterial = new LineBasicMaterial({ color: 0x00ff00 })

    const addDebug = (path: Readonly<Vector3[]>): void =>
    {
        if (entityManager.has("debug-path"))
        {
            entityManager.remove("debug-path")
        }

        const debugPath = new Entity()

        for (const waypoint of path)
        {
            const object = new Mesh(debugWaypointGeometry, debugWaypointMaterial)
            object.position.copy(waypoint)
            debugPath.add(object)
        }

        {
            const geometry = new BufferGeometry().setFromPoints(path.slice())
            const object = new Line(geometry, debugPathMaterial)
            debugPath.add(object)
        }

        entityManager.add("debug-path", "debug", debugPath)
    }

    return (): void =>
    {
        const click = mouse.getClick()

        if (!click)
        {
            return
        }

        raycaster.setFromCamera(click, camera.camera)
        const intersection = navMesh.getGridIntersection(raycaster)

        if (!intersection)
        {
            return
        }

        const segment = new Line3(player.position, intersection.point)
        const path = navMesh.getPath(segment)

        if (!path)
        {
            return
        }

        const movement = player.getComponent(ComponentMovement)
        movement.path = path
        addDebug(path)
    }
}
