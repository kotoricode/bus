import { get } from "svelte/store"
import { PerspectiveCamera, Vector3 } from "three"
import type { Entity } from "../entity"
import { layer } from "../layer"
import { storeDebug, storeSettings } from "../store"

export class WorldCamera extends PerspectiveCamera
{
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
        super(fov, aspectRatio, 1, 100)

        this.groundPosition.copy(this.position)
        this.position.add(this.offset)

        const angle = Math.atan(this.offset.y / this.offset.z)
        this.rotation.x = -angle

        storeDebug.subscribe(value =>
        {
            if (value)
            {
                this.layers.enable(layer.debug)
            }
            else
            {
                this.layers.disable(layer.debug)
            }
        })
    }

    jumpTo(target: Vector3): void
    {
        this.position.copy(target).add(this.offset)
    }

    track(target: Entity): void
    {
        this.trackTarget = target
    }
}
