const events: (() => boolean)[] = []

const active = (): boolean => !!events.length

const add = (event: () => boolean): void =>
{
    events.push(event)
}

const clear = (): void =>
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
    active,
    add,
    clear,
    update
}
