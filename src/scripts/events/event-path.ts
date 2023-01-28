import { Line3, type Vector3 } from "three"
import type { Entity } from "../entity"
import type { NavMesh } from "../nav-mesh"
import { EventBase } from "./event-base"

export class EventTimer extends EventBase
{
    private initialized = false
    private readonly segment = new Line3()

    constructor(
        private readonly entity: Entity,
        private readonly navMesh: NavMesh,
        target: Vector3
    )
    {
        super()
        this.segment.end.copy(target)
    }

    override run(): void
    {
        if (!this.initialized)
        {
            this.initialized = true
            this.segment.start.copy(this.entity.object.position)

            const path = this.navMesh.getPath(this.segment)

            if (path)
            {
                this.entity.path = path
            }
            else
            {
                this.entity.path = [this.segment.start, this.segment.end]
            }
        }

        this.done = !this.entity.path.length
    }
}
