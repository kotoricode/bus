import { get } from "svelte/store"
import { Vector2 } from "three"
import { storeSettings } from "./state"

let pointerEvent: PointerEvent | null
let clickPending: boolean
let clicked: boolean

const getCanvasClick = (): Readonly<Vector2> | null =>
{
    if (!clicked || !pointerEvent)
    {
        return null
    }

    const settings = get(storeSettings)

    return new Vector2(pointerEvent.clientX, settings.height - pointerEvent.clientY)
}

const getClick = (): Readonly<Vector2> | null =>
{
    if (!clicked || !pointerEvent)
    {
        return null
    }

    const settings = get(storeSettings)
    const x = pointerEvent.clientX / settings.width * 2 - 1
    const y = 1 - pointerEvent.clientY / settings.height * 2

    return new Vector2(x, y)
}

const init = (): void =>
{
    pointerEvent = null
    clickPending = false
    clicked = false
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
    getCanvasClick,
    getClick,
    init,
    setEvent,
    update
}
