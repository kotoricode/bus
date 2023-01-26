import type { SceneCamera } from "../scene-camera"
import { clock } from "../clock"
import type { GameTask } from "../interfaces"

export class TaskUpdateCamera implements GameTask
{
    constructor(private readonly camera: SceneCamera)
    {}

    run(): void
    {
        if (!this.camera.trackTarget)
        {
            return
        }

        const delta = this.camera.trackTarget.mesh.position.clone().sub(this.camera.groundPosition)
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
            this.camera.groundPosition.copy(this.camera.trackTarget.mesh.position)
        }

        this.camera.camera.position.copy(this.camera.groundPosition).add(this.camera.offset)
    }
}
