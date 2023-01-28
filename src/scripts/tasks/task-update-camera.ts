import type { WorldCamera } from "../camera/world-camera"
import { clock } from "../clock"

export const taskUpdateCamera = (camera: WorldCamera): () => void =>
    (): void =>
    {
        if (!camera.trackTarget)
        {
            return
        }

        const groundTarget = camera.trackTarget.position
        const delta = groundTarget.clone().sub(camera.groundPosition)
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
            camera.groundPosition.add(delta)
        }
        else
        {
            camera.groundPosition.copy(groundTarget)
        }

        camera.camera.position.copy(camera.groundPosition).add(camera.offset)
    }
