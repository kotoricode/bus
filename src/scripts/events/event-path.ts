import { Line3, type Vector3 } from "three"
import type { Character } from "../character"
import type { NavMesh } from "../nav-mesh"
import { EventBase } from "./event-base"

export class EventTimer extends EventBase
{
    private initialized = false
    private readonly segment = new Line3()

    constructor(
        private readonly character: Character,
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
            this.segment.start.copy(this.character.position)

            const path = this.navMesh.getPath(this.segment)

            if (path)
            {
                this.character.path = path
            }
            else
            {
                this.character.path = [this.segment.start, this.segment.end]
            }
        }

        this.done = !this.character.path.length
    }
}
