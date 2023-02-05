let _delta: number
let previousTimestamp: number

const delta = (): number => _delta

const init = (): void =>
{
    _delta = 0
    previousTimestamp = 0
}

const update = (timestamp: number): void =>
{
    _delta = timestamp - previousTimestamp
    previousTimestamp = timestamp
}

export const time = <const>{
    delta,
    init,
    update
}
