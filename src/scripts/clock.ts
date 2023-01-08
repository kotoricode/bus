import { Clock } from "three"

const _clock = new Clock()
let deltaTime: number

export const getDeltaTime = (): number =>
    deltaTime

const update = (): void =>
{
    deltaTime = _clock.getDelta()
}

export const clock = <const>{
    getDeltaTime,
    update
}
