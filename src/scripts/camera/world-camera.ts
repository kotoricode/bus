import { get } from "svelte/store"
import { PerspectiveCamera, Vector3 } from "three"
import type { Entity } from "../entity"
import { storeHeight, storeWidth } from "../state"
import { GameCamera } from "./game-camera"

export class WorldCamera extends GameCamera
{
    readonly camera: PerspectiveCamera
    readonly groundPosition = new Vector3()
    trackTarget: Entity | null = null

    constructor(public readonly offset: Vector3)
    {
        super()

        const width = get(storeWidth)
        const height = get(storeHeight)
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

    track(target: Entity): void
    {
        this.trackTarget = target
    }
}
