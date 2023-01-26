import { get } from "svelte/store"
import { Camera, OrthographicCamera, Vector2} from "three"
import type { GameCamera } from "./interfaces"
import { settingsHeight, settingsWidth } from "./state"

export class ImageCamera implements GameCamera
{
    camera: Camera

    constructor()
    {
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
