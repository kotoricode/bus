import type { WorldCamera } from "../camera/world-camera"
import { time } from "../time"

export const taskUpdateCamera = (camera: WorldCamera): () => void =>
{
    const minDistance = 0.05

    return (): void =>
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

        const deltaTime = time.getDelta()
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

        if (camera.groundBounds)
        {
            camera.groundPosition.clamp(camera.groundBounds.min, camera.groundBounds.max)
        }

        camera.camera.position.copy(camera.groundPosition).add(camera.offset)
    }
}
