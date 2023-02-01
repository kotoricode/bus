import {
    BufferGeometry, Line, Line3, LineBasicMaterial, Mesh, MeshBasicMaterial, Object3D, Raycaster,
    SphereGeometry, Vector2, Vector3
} from "three"
import type { WorldCamera } from "../camera/world-camera"
import { ComponentCollider } from "../components/component-collider"
import { ComponentMovement } from "../components/component-movement"
import type { Entity } from "../entity"
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
    const debugWaypointGeometry = new SphereGeometry(0.1)
    const debugWaypointMaterial = new MeshBasicMaterial({ color: 0x99ff00 })
    const debugPathMaterial = new LineBasicMaterial({ color: 0x00ff00 })

    const addDebug = (path: Readonly<Vector3[]>): void =>
    {
        const debugPath = new Object3D()
        debugPath.name = "debugPath"

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

        const rootDebug = entityManager.getDebug("root")
        const existingDebugPath = rootDebug.getObjectByName("debugPath")

        if (existingDebugPath)
        {
            rootDebug.remove(existingDebugPath)
        }

        rootDebug.add(debugPath)
    }

    const pickEntity = (click: Vector2): Entity | null =>
    {
        raycaster.setFromCamera(click, camera.camera)

        const start = raycaster.ray.origin.clone().setY(0)
        const direction = raycaster.ray.direction.clone()
        const end = start.clone().add(direction)
        const segment = new Line3(start, end)
        const entityPositionTarget = new Vector3()

        let pickedEntity: Entity | null = null
        let pickedEntityDistance = Infinity

        for (const entity of entityManager.entities.values())
        {
            const collider = entity.getComponent(ComponentCollider)

            if (!collider)
            {
                continue
            }

            const worldPosition = entity.getWorldPosition(entityPositionTarget).clone()
            worldPosition.setY(0)

            const closest = segment.closestPointToPoint(worldPosition, false, new Vector3())

            if (worldPosition.distanceTo(closest) > collider.radius)
            {
                continue
            }

            const distanceToEntity = raycaster.ray.origin.clone().distanceTo(entity.position)

            if (!pickedEntity || pickedEntityDistance > distanceToEntity)
            {
                pickedEntity = entity
                pickedEntityDistance = distanceToEntity
            }
        }

        return pickedEntity
    }

    const setPathTo = (click: Vector2): void =>
    {
        const movement = player.getComponent(ComponentMovement)

        if (!movement)
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

        movement.path = path
        addDebug(path)
    }

    return (): void =>
    {
        const click = mouse.getClick()

        if (!click)
        {
            return
        }

        const pickedEntity = pickEntity(click)

        if (!pickedEntity)
        {
            setPathTo(click)
        }
    }
}
