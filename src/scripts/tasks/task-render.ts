import type { Camera, Scene } from "three"
import type { GameTask } from "../interfaces"
import { rendering } from "../renderer"

export class TaskRender implements GameTask
{
    constructor(
        private readonly id: string,
        private readonly scene: Scene,
        private readonly camera: Camera
    )
    {}

    run(): void
    {
        const renderer = rendering.getRenderer()
        const renderTarget = rendering.getRenderTarget(this.id)
        renderer.setRenderTarget(renderTarget)
        renderer.render(this.scene, this.camera)
    }
}
