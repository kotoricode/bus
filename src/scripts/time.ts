let deltaTime: number
let previousTimestamp: number

const getDelta = (): number => deltaTime

const init = (): void =>
{
    deltaTime = 0
    previousTimestamp = 0
}

const update = (timestamp: number): void =>
{
    deltaTime = timestamp - previousTimestamp
    previousTimestamp = timestamp
}

export const time = <const>{
    getDelta,
    init,
    update
}
