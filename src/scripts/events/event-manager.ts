const events: (() => boolean)[] = []

const addEvent = (event: () => boolean): void =>
{
    events.push(event)
}

const clearEvents = (): void =>
{
    events.length = 0
}

const update = (): void =>
{
    while (events[0]?.())
    {
        events.shift()
    }
}

export const eventManager = <const>{
    addEvent,
    clearEvents,
    update
}
