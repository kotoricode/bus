import type { Camera, Scene } from "three"
import { GameTask } from "./game-task"
import { rendering } from "../renderer"

export class TaskRender extends GameTask
{
    constructor(
        private readonly id: string,
        private readonly scene: Scene,
        private readonly camera: Camera
    )
    {
        super()
    }

    run(): void
    {
        const renderer = rendering.getRenderer()
        const renderTarget = rendering.getRenderTarget(this.id)
        renderer.setRenderTarget(renderTarget)
        renderer.render(this.scene, this.camera)
    }
}
