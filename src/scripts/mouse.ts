import { get } from "svelte/store"
import { Vector2 } from "three"
import { settingsHeight, settingsWidth } from "./state"

let pointerEvent: PointerEvent
let clickPending = false
let clicked = false

const getClick = (): Vector2 | null =>
{
    if (!clicked)
    {
        return null
    }

    const width = get(settingsWidth)
    const height = get(settingsHeight)

    const x = pointerEvent.clientX / width * 2 - 1
    const y = 1 - pointerEvent.clientY / height * 2

    return new Vector2(x, y)
}

const setEvent = (event: PointerEvent): void =>
{
    pointerEvent = event
    clickPending = true
}

const update = (): void =>
{
    clicked = clickPending
    clickPending = false
}

export const mouse = <const>{
    getClick,
    setEvent,
    update
}
