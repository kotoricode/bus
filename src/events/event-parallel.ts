import { EventBase } from "./event-base"

export class EventParallel extends EventBase
{
    constructor(private events: EventBase[])
    {
        super()
    }

    override run(): void
    {
        for (const event of this.events)
        {
            if (!event.done)
            {
                event.run()
            }
        }

        this.done = this.events.every(event => event.done)
    }
}
