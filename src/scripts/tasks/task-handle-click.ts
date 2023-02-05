import {
    Box3, BufferGeometry, Line, Line3, LineBasicMaterial, Mesh, MeshBasicMaterial, Object3D, Plane,
    Raycaster, SphereGeometry, Vector3
} from "three"
import type { WorldCamera } from "../camera/world-camera"
import { ComponentCollider } from "../components/component-collider"
import { ComponentMovement } from "../components/component-movement"
import type { Entity } from "../entity"
import type { EntityManager } from "../entity-manager"
import { mouse } from "../mouse"
import type { NavMesh } from "../nav-mesh"

const pickEntity = (entityManager: EntityManager, raycaster: Raycaster): () => Entity | null =>
{
    const up = new Vector3(0, 1, 0)
    const topPlane = new Plane(up)
    const botPlane = new Plane(up)
    const topPlaneIntersectionTarget = new Vector3()
    const botPlaneIntersectionTarget = new Vector3()

    const worldBox = new Box3()
    const worldPositionTarget = new Vector3()

    const segment = new Line3()
    const closest = new Vector3()
    const closestTarget = new Vector3()

    return (): Entity | null =>
    {
        let pickedEntity: Entity | null = null
        let pickedEntityDistance = Infinity

        for (const entity of entityManager.entities.values())
        {
            const collider = entity.getComponent(ComponentCollider)

            if (!collider)
            {
                continue
            }

            const worldPosition = entity.getWorldPosition(worldPositionTarget)
            worldBox.copy(collider.hitbox).translate(worldPosition)
            const intersectsHitbox = raycaster.ray.intersectsBox(worldBox)

            if (!intersectsHitbox)
            {
                continue
            }

            topPlane.constant = -worldBox.max.y
            const topPlaneIntersection = raycaster.ray.intersectPlane(topPlane, topPlaneIntersectionTarget)

            if (!topPlaneIntersection)
            {
                continue
            }

            botPlane.constant = -worldBox.min.y
            const botPlaneIntersection = raycaster.ray.intersectPlane(botPlane, botPlaneIntersectionTarget)

            if (!botPlaneIntersection)
            {
                continue
            }

            segment.start.copy(topPlaneIntersection).setY(0)
            segment.end.copy(botPlaneIntersection).setY(0)
            closest.copy(worldPosition).setY(0)

            segment.closestPointToPoint(closest, true, closestTarget)
            const distance = closestTarget.distanceTo(closest)

            if (distance <= collider.radius && distance < pickedEntityDistance)
            {
                pickedEntity = entity
                pickedEntityDistance = distance
            }
        }

        return pickedEntity
    }
}

const setPathTo = (
    entityManager: EntityManager,
    raycaster: Raycaster,
    navMesh: NavMesh,
    player: Entity
): () => void  =>
{
    const debugWaypointGeometry = new SphereGeometry(0.1)
    const debugWaypointMaterial = new MeshBasicMaterial({ color: 0x99ff00 })
    const debugPathMaterial = new LineBasicMaterial({ color: 0x00ff00 })
    const debugPathName = "debugPath"
    const rootDebug = entityManager.getDebug("root")
    const debugPathLine = new Line()
    const debugPathGeometry = new BufferGeometry()

    const addDebug = (path: Vector3[]): void =>
    {
        const debugPath = new Object3D()
        debugPath.name = debugPathName

        for (const waypoint of path)
        {
            const object = new Mesh(debugWaypointGeometry, debugWaypointMaterial)
            object.position.copy(waypoint)
            debugPath.add(object)
        }

        {
            debugPathLine.geometry = debugPathGeometry.setFromPoints(path.slice())
            debugPathLine.material = debugPathMaterial
            debugPath.add(debugPathLine)
        }

        const existingDebugPath = rootDebug.getObjectByName(debugPathName)

        if (existingDebugPath)
        {
            rootDebug.remove(existingDebugPath)
        }

        rootDebug.add(debugPath)
    }

    const segment = new Line3()

    return (): void =>
    {
        const movement = player.getComponent(ComponentMovement)

        if (movement)
        {
            const intersection = navMesh.getGridIntersection(raycaster)

            if (intersection)
            {
                segment.start.copy(player.position)
                segment.end.copy(intersection.point)

                const path = navMesh.getPath(segment)

                if (path)
                {
                    movement.path = path
                    addDebug(path)
                }
            }
        }
    }
}

export const taskHandleClick = (
    entityManager: EntityManager,
    camera: WorldCamera,
    navMesh: NavMesh,
    player: Entity
): () => void =>
{
    const raycaster = new Raycaster()
    const _pickEntity = pickEntity(entityManager, raycaster)
    const _setPathTo = setPathTo(entityManager, raycaster, navMesh, player)

    return (): void =>
    {
        const click = mouse.getClick()

        if (click)
        {
            raycaster.setFromCamera(click, camera.camera)
            const pickedEntity = _pickEntity()

            if (!pickedEntity)
            {
                _setPathTo()
            }
        }
    }
}
