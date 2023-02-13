import { get } from "svelte/store"
import { Vector2 } from "three"
import { store } from "./store"

let clickEvent: PointerEvent | null = null
let clickPending = false
let clicked = false
let moveEvent: PointerEvent
const position = new Vector2()
const canvasPosition = new Vector2()

const getCanvasPosition = (): Readonly<Vector2> =>
{
    if (!moveEvent)
    {
        return canvasPosition
    }

    const settings = get(store.settings)

    canvasPosition.set(
        moveEvent.clientX,
        settings.height - 1 - moveEvent.clientY
    )

    return canvasPosition
}

const getClick = (): boolean => !!(clicked && clickEvent)

const getPosition = (): Readonly<Vector2> =>
{
    if (!moveEvent)
    {
        return position
    }

    const settings = get(store.settings)

    position.set(
        moveEvent.clientX / settings.width * 2 - 1,
        1 - moveEvent.clientY / settings.height * 2
    )

    return position
}

const setClickEvent = (event: PointerEvent): void =>
{
    clickEvent = event
    clickPending = true
    setMoveEvent(event)
}

const setMoveEvent = (event: PointerEvent): void =>
{
    moveEvent = event
}

const update = (): void =>
{
    clicked = clickPending
    clickPending = false
}

export const mouse = <const>{
    getCanvasPosition,
    getClick,
    getPosition,
    setClickEvent,
    setMoveEvent,
    update
}
