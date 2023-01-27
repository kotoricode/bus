import type { Camera, Scene } from "three"
import { GameTask } from "./game-task"
import { rendering } from "../renderer"

export class TaskRender extends GameTask
{
    constructor(
        private readonly scene: Scene,
        private readonly camera: Camera,
        private readonly renderTargetId: string
    )
    {
        super()
    }

    run(): void
    {
        rendering.render(this.scene, this.camera, this.renderTargetId)
    }
}
