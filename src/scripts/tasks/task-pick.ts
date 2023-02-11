import { Material, Mesh, Scene } from "three"
import type { WorldCamera } from "../camera/world-camera"
import { ComponentPicking } from "../components/component-picking"
import type { EntityManager } from "../entity-manager"
import { rendering } from "../rendering"

export const taskPick = (entityManager: EntityManager, sceneCamera: WorldCamera): (() => void) =>
{
    const originalMaterials = new Map<Mesh, Material | Material[]>()
    const scene = new Scene()

    return (): void =>
    {
        for (const entity of entityManager.entities.values())
        {
            const picking = entity.getComponent(ComponentPicking)

            if (!picking)
            {
                continue
            }

            for (const child of entity.children)
            {
                if (child instanceof Mesh)
                {
                    originalMaterials.set(child, child.material)
                    child.material = picking.colorMaterial
                }
            }
        }

        rendering.render(scene, sceneCamera.camera, "picking")

        originalMaterials.clear()
    }
}
