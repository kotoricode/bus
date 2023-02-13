let delta = 0
let previousTimestamp = 0

const getDelta = (): number => delta

const update = (timestamp: number): void =>
{
    delta = timestamp - previousTimestamp
    previousTimestamp = timestamp
}

export const time = <const>{
    getDelta,
    update
}
