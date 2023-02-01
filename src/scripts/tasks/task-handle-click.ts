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

        let pickedEntity: Entity | null = null
        let pickedEntityDistance = Infinity

        for (const entity of entityManager.entities.values())
        {
            const collider = entity.getComponent(ComponentCollider)

            if (!collider)
            {
                continue
            }

            const entityWorldPosition = entity.getWorldPosition(new Vector3())

            const worldBox = collider.hitbox.clone()
            worldBox.translate(entityWorldPosition)

            const intersectsHitbox = raycaster.ray.intersectsBox(worldBox)

            if (!intersectsHitbox)
            {
                continue
            }

            const originXZ = raycaster.ray.origin.clone().setY(entityWorldPosition.y)
            const directionXZ = raycaster.ray.direction.clone().setY(entityWorldPosition.y)
            const segmentXZ = new Line3(originXZ, originXZ.clone().add(directionXZ))

            const result = segmentXZ.closestPointToPoint(entityWorldPosition, false, new Vector3())
            const distance = result.distanceTo(entityWorldPosition)

            if (distance <= collider.radius && distance < pickedEntityDistance)
            {
                pickedEntity = entity
                pickedEntityDistance = distance
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
