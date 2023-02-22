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
        const pickingMeshes = new Set<{ picking: ComponentPicking, entity: Entity, meshes: Object3D }>()

        for (const entity of entityManager.entities.values())
        {
            const picking = entity.getComponent(ComponentPicking)

            if (!picking)
            {
                continue
            }

            const meshes = entity.getObjectByName("meshes")

            if (!meshes)
            {
                continue
            }

            pickingMeshes.add({
                picking,
                entity,
                meshes
            })

            modelManager.setModelUniform(entity, "pickingMode", true)
            modelManager.setModelUniform(entity, "picking", picking.uniform)
            meshes.traverse(m => m.layers.enable(layer.picking))
        }

        const cameraMask = camera.layers.mask
        camera.layers.set(layer.picking)
        rendering.render(scene, camera, "renderTargetPicking")
        camera.layers.mask = cameraMask

        const pickedColor = rendering.getPixelColor(canvasPosition, "renderTargetPicking")

        let picked: Entity | null = null

        for (const { picking, entity, meshes } of pickingMeshes)
        {
            if (pickedColor === picking.color)
            {
                picked = entity
            }

            modelManager.setModelUniform(entity, "pickingMode", false)
            modelManager.setModelUniform(entity, "picking", picking.uniform)
            meshes.traverse(m => m.layers.enable(layer.picking))
        }

        store.pickedEntity.set(picked)
    }
}
