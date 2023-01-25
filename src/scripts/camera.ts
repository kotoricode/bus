import { get } from "svelte/store"
import { PerspectiveCamera, Vector3 } from "three"
import type { Character } from "./character"
import { settingsHeight, settingsWidth } from "./state"

export class GameCamera
{
    camera: PerspectiveCamera
    groundPosition = new Vector3()
    trackTarget: Character | null = null

    constructor(public readonly offset: Vector3)
    {
        const width = get(settingsWidth)
        const height = get(settingsHeight)
        const aspectRatio = width / height

        this.camera = new PerspectiveCamera(45, aspectRatio, 1, 50)
        this.groundPosition.copy(this.camera.position)
        this.camera.position.add(this.offset)

        const angle = Math.atan(this.offset.y / this.offset.z)
        this.camera.rotation.x = -angle
    }

    jumpTo(target: Vector3): void
    {
        this.camera.position.copy(target).add(this.offset)
    }

    track(target: Character): void
    {
        this.trackTarget = target
    }
}
