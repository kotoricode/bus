import { OrthographicCamera, Vector2 } from "three"

export class ImageCamera extends OrthographicCamera
{
    constructor(size: Readonly<Vector2>)
    {
        super(-size.x / 2, size.x / 2, size.y / 2, -size.y / 2)
        this.position.z = 1
    }
}
