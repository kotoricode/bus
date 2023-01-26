import { get } from "svelte/store"
import { Camera, OrthographicCamera, Vector2} from "three"
import { settingsHeight, settingsWidth } from "../state"
import { GameCamera } from "./game-camera"

export class ImageCamera extends GameCamera
{
    readonly camera: Camera

    constructor()
    {
        super()

        const width = get(settingsWidth)
        const height = get(settingsHeight)
        const size = new Vector2()

        if (width > height)
        {
            size.set(width / height, 1)
        }
        else
        {
            size.set(1, width / height)
        }

        this.camera = new OrthographicCamera(
            -size.x / 2,
            size.x / 2,
            size.y / 2,
            -size.y / 2
        )

        this.camera.position.z = 1
    }
}
