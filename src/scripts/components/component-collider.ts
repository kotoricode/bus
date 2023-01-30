import { Box3, Vector3 } from "three"

export class ComponentCollider
{
    readonly hitbox: Box3

    constructor(public readonly radius: number, public readonly height: number)
    {
        const hypot = (2 * radius ** 2) ** 0.5

        this.hitbox = new Box3(
            new Vector3(-hypot, 0, -hypot),
            new Vector3(hypot, height, hypot)
        )
    }
}
