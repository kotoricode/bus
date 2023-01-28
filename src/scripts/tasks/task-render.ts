import type { Camera, Scene } from "three"
import { rendering } from "../renderer"

export const taskRender = (scene: Scene, camera: Camera, renderTargetId: string) =>
    (): void => rendering.render(scene, camera, renderTargetId)
