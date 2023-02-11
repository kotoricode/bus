import type { WorldCamera } from "../camera/world-camera"
import { time } from "../time"

export const taskUpdateCamera = (worldCamera: WorldCamera): (() => void) =>
{
    const minDistance = 0.05

    return (): void =>
    {
        if (!worldCamera.trackTarget)
        {
            return
        }

        const groundTarget = worldCamera.trackTarget.position
        const delta = groundTarget.clone().sub(worldCamera.groundPosition)
        const distance = delta.length()

        if (!distance)
        {
            return
        }

        const deltaTime = time.delta()
        const step = Math.max(minDistance, distance) * deltaTime

        if (step < distance)
        {
            const multiplier = 1 - (1 - step / distance) ** 3
            delta.multiplyScalar(multiplier)
            worldCamera.groundPosition.add(delta)
        }
        else
        {
            worldCamera.groundPosition.copy(groundTarget)
        }

        if (worldCamera.groundBounds)
        {
            worldCamera.groundPosition.clamp(worldCamera.groundBounds.min, worldCamera.groundBounds.max)
        }

        worldCamera.camera.position.copy(worldCamera.groundPosition).add(worldCamera.offset)
    }
}
