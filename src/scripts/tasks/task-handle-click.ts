import { get } from "svelte/store"
import {
    BufferGeometry, Line, Line3, LineBasicMaterial, Mesh, MeshBasicMaterial, Object3D,
    Raycaster, SphereGeometry, Vector3
} from "three"
import type { WorldCamera } from "../camera/world-camera"
import { ComponentMovement } from "../components/component-movement"
import type { Entity } from "../entity"
import type { EntityManager } from "../entity-manager"
import { layer } from "../layer"
import { mouse } from "../mouse"
import type { NavMesh } from "../nav-mesh"
import { store } from "../store"

const setPathTo = (
    entityManager: EntityManager,
    raycaster: Raycaster,
    navMesh: NavMesh,
    player: Entity
): () => void  =>
{
    const debugWaypointGeometry = new SphereGeometry(0.06)
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
        debugPath.layers.set(layer.debug)

        for (const waypoint of path)
        {
            const mesh = new Mesh(debugWaypointGeometry, debugWaypointMaterial)
            mesh.position.copy(waypoint)
            mesh.layers.set(layer.debug)
            debugPath.add(mesh)
        }

        {
            debugPathLine.geometry = debugPathGeometry.setFromPoints(path.slice())
            debugPathLine.material = debugPathMaterial
            debugPathLine.layers.set(layer.debug)
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
        const movement = player.getComponentUnwrap(ComponentMovement)
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

export const taskHandleClick = (
    entityManager: EntityManager,
    camera: WorldCamera,
    navMesh: NavMesh,
    player: Entity
): (() => void) =>
{
    const raycaster = new Raycaster()
    const _setPathTo = setPathTo(entityManager, raycaster, navMesh, player)

    return (): void =>
    {
        const position = mouse.getPosition()
        raycaster.setFromCamera(position, camera)
        const pickedEntity = get(store.pickedEntity)

        const click = mouse.getClick()

        if (pickedEntity)
        {
            console.log(pickedEntity)
        }
        else if (click)
        {
            _setPathTo()
        }
    }
}
