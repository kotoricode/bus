import type { EventBase } from "./event-base"

const events: EventBase[] = []

const addEvent = (event: EventBase): void =>
{
    events.push(event)
}

const update = (): void =>
{
    while (events.length)
    {
        events[0].run()
        const completed = events[0].getCompleted()

        if (completed)
        {
            events.shift()
        }
        else
        {
            return
        }
    }
}

export const eventManager = <const>{
    addEvent,
    update
}
