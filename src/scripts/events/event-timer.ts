import { clock } from "../clock"
import { EventBase } from "./event-base"

export class EventTimer extends EventBase
{
    constructor(private timer: number)
    {
        super()
    }

    override run(): void
    {
        const dt = clock.getDeltaTime()
        this.timer -= dt

        if (this.timer <= 0)
        {
            this.done = true
        }
    }
}
