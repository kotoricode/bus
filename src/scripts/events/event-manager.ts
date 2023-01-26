import type { EventBase } from "./event-base"

const events: EventBase[] = []

const active = (): boolean =>
    !!events.length

const addEvent = (event: EventBase): void =>
{
    events.push(event)
}

const update = (): void =>
{
    while (events.length)
    {
        const currentEvent = events[0]
        currentEvent.run()

        if (!currentEvent.done)
        {
            return
        }

        events.shift()
    }
}

export const eventManager = <const>{
    active,
    addEvent,
    update
}
