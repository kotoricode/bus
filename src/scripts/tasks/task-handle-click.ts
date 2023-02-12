import {
    BufferGeometry, Camera, Line, Line3, LineBasicMaterial, Material, Mesh, MeshBasicMaterial, Object3D,
    Raycaster, Scene, SphereGeometry, Vector3
} from "three"
import type { WorldCamera } from "../camera/world-camera"
import { ComponentMovement } from "../components/component-movement"
import { ComponentPicking } from "../components/component-picking"
import type { Entity } from "../entity"
import type { EntityManager } from "../entity-manager"
import { layer } from "../layer"
import { mouse } from "../mouse"
import type { NavMesh } from "../nav-mesh"
import { rendering } from "../rendering"

const pickEntity = (scene: Scene, camera: Camera, entityManager: EntityManager): Entity | null =>
{
    const click = mouse.getCanvasClick()

    if (!click)
    {
        return null
    }

    const meshMaterials = new Map<Mesh, Material>()
    const colorEntities = new Map<number, Entity>()

    for (const entity of entityManager.entities.values())
    {
        const picking = entity.getComponent(ComponentPicking)

        if (!picking)
        {
            continue
        }

        colorEntities.set(picking.color, entity)

        for (const child of entity.children)
        {
            if (child.name === "meshes")
            {
                for (const grandChild of child.children)
                {
                    if (grandChild instanceof Mesh)
                    {
                        meshMaterials.set(grandChild, grandChild.material)
                        grandChild.material = picking.colorMaterial
                    }
                }
            }
        }
    }

    const debugMode = camera.layers.isEnabled(layer.debug)
    camera.layers.disable(layer.debug)

    rendering.render(scene, camera, "picking")

    if (debugMode)
    {
        camera.layers.enable(layer.debug)
    }

    for (const [mesh, material] of meshMaterials)
    {
        mesh.material = material
    }

    const color = rendering.getPixelColor(click, "picking")

    return colorEntities.get(color) ?? null
}

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
    scene: Scene,
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
        const click = mouse.getClick()

        if (click)
        {
            raycaster.setFromCamera(click, camera)
            const pickedEntity = pickEntity(scene, camera, entityManager)

            if (pickedEntity)
            {
                console.log(pickedEntity)
            }
            else
            {
                _setPathTo()
            }
        }
    }
}
