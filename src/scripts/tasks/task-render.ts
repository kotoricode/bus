import type { Camera, Scene } from "three"
import { rendering } from "../rendering"

export const taskRender = (scene: Scene, camera: Camera, renderTargetId?: string) =>
{
    return (): void =>
    {
        rendering.render(scene, camera, renderTargetId)
    }
}
