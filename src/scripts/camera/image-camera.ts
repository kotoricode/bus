import { get } from "svelte/store"
import { Camera, OrthographicCamera, Vector2} from "three"
import { storeHeight, storeWidth } from "../state"
import { GameCamera } from "./game-camera"

export class ImageCamera extends GameCamera
{
    readonly camera: Camera

    constructor()
    {
        super()

        const width = get(storeWidth)
        const height = get(storeHeight)
        const size = new Vector2()

        if (width > height)
        {
            size.set(width / height, 1)
        }
        else
        {
            size.set(1, width / height)
        }

        size.multiplyScalar(0.5)
        this.camera = new OrthographicCamera(-size.x, size.x, size.y, -size.y)
        this.camera.position.z = 1
    }
}
