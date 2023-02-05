import { Vector3 } from "three"
import { time } from "../time"
import type { EntityManager } from "../entity-manager"
import { ComponentMovement } from "../components/component-movement"

const rotationBase = 0.0008
const rotationDifferenceModifier = 0.0032

export const taskUpdateTransforms = (entityManager: EntityManager): () => void =>
{
    const updateMovement = (): void =>
    {
        const deltaTime = time.delta()
        const difference = new Vector3()
        const differenceXZ = new Vector3()
        const forward = new Vector3(0, 0, 1)

        for (const entity of entityManager.entities.values())
        {
            const movement = entity.getComponent(ComponentMovement)

            if (!movement || !movement.speed || !movement.path.length)
            {
                continue
            }

            let step = deltaTime * movement.speed
            let traversed = 0

            for (const waypoint of movement.path)
            {
                const distance = entity.position.distanceTo(waypoint)

                if (distance)
                {
                    difference.copy(waypoint).sub(entity.position)
                    const sign = Math.sign(difference.x || difference.z)
                    differenceXZ.setX(difference.x).setZ(difference.z)
                    movement.targetRotation = sign * forward.angleTo(differenceXZ)

                    if (step < distance)
                    {
                        const direction = difference.multiplyScalar(step / distance)
                        entity.position.add(direction)

                        break
                    }

                    step -= distance
                }

                entity.position.copy(waypoint)
                traversed++
            }

            if (traversed)
            {
                movement.path.splice(0, traversed)
            }
        }
    }

    const updateRotation = (): void =>
    {
        const deltaTime = time.delta()

        for (const entity of entityManager.entities.values())
        {
            const movement = entity.getComponent(ComponentMovement)

            if (!movement)
            {
                continue
            }

            let oldRotation = entity.rotation.y
            let newRotation = movement.targetRotation

            if (oldRotation === newRotation)
            {
                continue
            }

            let diff = newRotation - oldRotation
            let absDiff = Math.abs(diff)

            if (absDiff > Math.PI)
            {
                if (newRotation < 0)
                {
                    newRotation += Math.PI * 2
                }
                else
                {
                    oldRotation += Math.PI * 2
                }

                diff = newRotation - oldRotation
                absDiff = Math.abs(diff)
            }

            const turn = (rotationBase + absDiff * rotationDifferenceModifier) * deltaTime
            const step = Math.sign(diff) * Math.min(turn, absDiff)
            let rotation = oldRotation + step

            if (rotation > Math.PI)
            {
                rotation -= Math.PI * 2
            }

            entity.rotation.y = rotation
        }
    }

    return (): void =>
    {
        updateMovement()
        updateRotation()
    }
}
