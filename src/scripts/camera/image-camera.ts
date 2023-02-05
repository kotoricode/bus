import { OrthographicCamera, Vector2 } from "three"

export class ImageCamera
{
    readonly camera: OrthographicCamera

    constructor(size: Readonly<Vector2>)
    {
        this.camera = new OrthographicCamera(-size.x / 2, size.x / 2, size.y / 2, -size.y / 2)
        this.camera.position.z = 1
    }
}
