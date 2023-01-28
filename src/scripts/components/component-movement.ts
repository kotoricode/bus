import type { Vector3 } from "three"

export class ComponentMovement
{
    path: Vector3[] = []
    targetRotation = 0

    constructor(public speed: number)
    {}
}
