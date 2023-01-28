import type { WorldCamera } from "../camera/world-camera"
import { clock } from "../clock"
import { GameTask } from "./game-task"

export class TaskUpdateCamera extends GameTask
{
    constructor(private readonly camera: WorldCamera)
    {
        super()
    }

    run(): void
    {
        if (!this.camera.trackTarget)
        {
            return
        }

        const groundTarget = this.camera.trackTarget.position

        const delta = groundTarget.clone().sub(this.camera.groundPosition)

        const distance = delta.length()

        if (!distance)
        {
            return
        }

        const minDistance = 0.05
        const deltaTime = clock.getDeltaTime()
        const step = Math.max(minDistance, distance) * deltaTime

        if (step < distance)
        {
            const multiplier = 1 - (1 - step / distance) ** 3
            delta.multiplyScalar(multiplier)
            this.camera.groundPosition.add(delta)
        }
        else
        {
            this.camera.groundPosition.copy(groundTarget)
        }

        this.camera.camera.position.copy(this.camera.groundPosition).add(this.camera.offset)
    }
}
