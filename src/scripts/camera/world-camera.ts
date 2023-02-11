import { get } from "svelte/store"
import { PerspectiveCamera, Vector3 } from "three"
import type { Entity } from "../entity"
import { layer } from "../layer"
import { storeDebug, storeSettings } from "../state"

export class WorldCamera
{
    readonly camera: PerspectiveCamera
    readonly groundPosition = new Vector3()
    trackTarget: Entity | null = null

    constructor(
        public readonly offset: Vector3,
        fov: number,
        public readonly groundBounds: {
            min: Readonly<Vector3>,
            max: Readonly<Vector3>
        } | null
    )
    {
        const settings = get(storeSettings)
        const aspectRatio = settings.width / settings.height

        this.camera = new PerspectiveCamera(fov, aspectRatio, 1, 100)
        this.groundPosition.copy(this.camera.position)
        this.camera.position.add(this.offset)

        const angle = Math.atan(this.offset.y / this.offset.z)
        this.camera.rotation.x = -angle

        storeDebug.subscribe(value =>
        {
            if (value)
            {
                this.camera.layers.enable(layer.debug)
            }
            else
            {
                this.camera.layers.disable(layer.debug)
            }
        })
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
