import type { Object3D, Scene } from "three"
import type { WorldCamera } from "../camera/world-camera"
import { ComponentPicking } from "../components/component-picking"
import type { Entity } from "../entity"
import type { EntityManager } from "../entity-manager"
import { layer } from "../layer"
import { modelManager } from "../model-manager"
import { mouse } from "../mouse"
import { rendering } from "../rendering"
import { store } from "../store"

export const taskPickEntity = (
    scene: Scene,
    entityManager: EntityManager,
    camera: WorldCamera
): (() => void) =>
{
    return (): void =>
    {
        const canvasPosition = mouse.getCanvasPosition()
        const colorEntities = new Map<number, Entity>()
        const pickingMeshes = new Set<Object3D>()

        for (const entity of entityManager.entities.values())
        {
            const picking = entity.getComponent(ComponentPicking)

            if (!picking)
            {
                continue
            }

            picking.uniform.x = 1.0
            colorEntities.set(picking.color, entity)
            modelManager.setModelUniform(entity, "picking", picking.uniform)

            const meshes = entity.getObjectByName("meshes")

            if (meshes)
            {
                meshes.traverse(m => m.layers.enable(layer.picking))
                pickingMeshes.add(meshes)
            }
        }

        const cameraMask = camera.layers.mask
        camera.layers.set(layer.picking)
        rendering.render(scene, camera, "renderTargetPicking")
        camera.layers.mask = cameraMask

        const pickedColor = rendering.getPixelColor(canvasPosition, "renderTargetPicking")

        let picked: Entity | null = null

        for (const [color, entity] of colorEntities)
        {
            if (pickedColor === color)
            {
                picked = entity
            }

            const picking = entity.getComponentUnwrap(ComponentPicking)
            picking.uniform.x = 0
            modelManager.setModelUniform(entity, "picking", picking.uniform)
        }

        for (const meshes of pickingMeshes)
        {
            meshes.traverse(m => m.layers.enable(layer.picking))
        }

        store.pickedEntity.set(picked)
    }
}
