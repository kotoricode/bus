import { Vector3 } from "three"
import { clock } from "../clock"
import { GameTask } from "./game-task"
import type { EntityManager } from "../entity-manager"
import { ComponentMovement } from "../components/component-movement"

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
            if (!entity.hasComponent(ComponentMovement))
            {
                continue
            }

            const movement = entity.getComponent(ComponentMovement)

            if (!movement.speed || !movement.path.length)
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
                    differenceXZ.copy(difference).setY(0)
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

    updateRotation(): void
    {
        const deltaTime = clock.getDeltaTime()
        const turnBase = 0.7
        const turnDiffModifier = 3.8

        for (const entity of this.entityManager)
        {
            if (!entity.hasComponent(ComponentMovement))
            {
                continue
            }

            const movement = entity.getComponent(ComponentMovement)

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

            const turn = (turnBase + absDiff * turnDiffModifier) * deltaTime

            const step = Math.sign(diff) * Math.min(turn, absDiff)
            let rotation = oldRotation + step

            if (rotation > Math.PI)
            {
                rotation -= Math.PI * 2
            }

            entity.rotation.y = rotation
        }
    }
}
