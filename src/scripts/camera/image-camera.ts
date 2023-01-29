import { Camera, OrthographicCamera, Vector2} from "three"
import { GameCamera } from "./game-camera"

export class ImageCamera extends GameCamera
{
    readonly camera: Camera

    constructor(size: Readonly<Vector2>)
    {
        super()
        this.camera = new OrthographicCamera(-size.x / 2, size.x / 2, size.y / 2, -size.y / 2)
        this.camera.position.z = 1
    }
}
