import { Vector3 } from "three"
import type { Character } from "../character"
import { clock } from "../clock"
import { TAU } from "../const"
import { GameTask } from "./game-task"

export class TaskUpdateTransform extends GameTask
{
    constructor(private readonly characters: Map<string, Character>)
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

        for (const character of this.characters.values())
        {
            let step = deltaTime * character.speed
            let traversed = 0

            for (const waypoint of character.path)
            {
                const distance = character.position.distanceTo(waypoint)

                if (distance)
                {
                    difference.copy(waypoint).sub(character.position)
                    const sign = Math.sign(difference.x || difference.z)
                    differenceXZ.copy(difference).setY(0)
                    character.targetRotation = sign * forward.angleTo(differenceXZ)

                    if (step < distance)
                    {
                        const direction = difference.multiplyScalar(step / distance)
                        character.position.add(direction)

                        break
                    }

                    step -= distance
                }

                character.position.copy(waypoint)
                traversed++
            }

            if (traversed)
            {
                character.path.splice(0, traversed)
            }
        }
    }

    updateRotation(): void
    {
        const deltaTime = clock.getDeltaTime()
        const turnBase = 0.7
        const turnDiffModifier = 3.8

        for (const character of this.characters.values())
        {
            let oldRotation = character.rotation
            let newRotation = character.targetRotation

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

            character.rotation = rotation
        }
    }
}
