import { Vector3 } from "three"
import { clock } from "../clock"
import { TAU } from "../const"
import { GameTask } from "./game-task"
import type { EntityManager } from "../entity-manager"

export class TaskUpdateTransform extends GameTask
{
    constructor(private readonly entityManager: EntityManager)
    {
        super()
    }

    run(): void
    {
        this.updateMovement()
        this.updateRotation()
    }

    updateMovement(): void
    {
        const deltaTime = clock.getDeltaTime()
        const difference = new Vector3()
        const differenceXZ = new Vector3()
        const forward = new Vector3(0, 0, 1)

        for (const entity of this.entityManager)
        {
            if (!entity.speed || !entity.path.length)
            {
                continue
            }

            let step = deltaTime * entity.speed
            let traversed = 0

            for (const waypoint of entity.path)
            {
                const distance = entity.object.position.distanceTo(waypoint)

                if (distance)
                {
                    difference.copy(waypoint).sub(entity.object.position)
                    const sign = Math.sign(difference.x || difference.z)
                    differenceXZ.copy(difference).setY(0)
                    entity.targetRotation = sign * forward.angleTo(differenceXZ)

                    if (step < distance)
                    {
                        const direction = difference.multiplyScalar(step / distance)
                        entity.object.position.add(direction)

                        break
                    }

                    step -= distance
                }

                entity.object.position.copy(waypoint)
                traversed++
            }

            if (traversed)
            {
                entity.path.splice(0, traversed)
            }
        }
    }

    updateRotation(): void
    {
        const deltaTime = clock.getDeltaTime()
        const turnBase = 0.7
        const turnDiffModifier = 3.8

        for (const entity of this.entityManager)
        {
            let oldRotation = entity.object.rotation.y
            let newRotation = entity.targetRotation

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
                    newRotation += TAU
                }
                else
                {
                    oldRotation += TAU
                }

                diff = newRotation - oldRotation
                absDiff = Math.abs(diff)
            }

            const turn = (turnBase + absDiff * turnDiffModifier) * deltaTime

            const step = Math.sign(diff) * Math.min(turn, absDiff)
            let rotation = oldRotation + step

            if (rotation > Math.PI)
            {
                rotation -= TAU
            }

            entity.object.rotation.y = rotation
        }
    }
}
