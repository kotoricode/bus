import type { Scene } from "three"
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

        for (const entity of entityManager.entities.values())
        {
            const picking = entity.getComponent(ComponentPicking)

            if (!picking)
            {
                continue
            }

            picking.uniform.x = 1
            modelManager.setModelUniform(entity, "picking", picking.uniform)

            colorEntities.set(picking.color, entity)
        }

        const debugMode = camera.layers.isEnabled(layer.debug)
        camera.layers.disable(layer.debug)

        rendering.render(scene, camera, "renderTargetPicking")

        if (debugMode)
        {
            camera.layers.enable(layer.debug)
        }

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

        store.pickedEntity.set(picked)
    }
}
