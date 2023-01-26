import type { Scene } from "three"
import type { GameCamera, GameTask } from "../interfaces"
import { renderer } from "../renderer"

export class TaskRender implements GameTask
{
    constructor(
        private readonly id: string,
        private readonly scene: Scene,
        private readonly camera: GameCamera
    )
    {}

    run(): void
    {
        const _renderer = renderer.getRenderer()
        const renderTarget = renderer.getRenderTarget(this.id)
        _renderer.setRenderTarget(renderTarget)
        _renderer.render(this.scene, this.camera.camera)
    }
}
