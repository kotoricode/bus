import { get } from "svelte/store"
import { Vector2 } from "three"
import { storeSettings } from "./state"

let clickEvent: PointerEvent | null
let clickPending: boolean
let clicked: boolean
let moveEvent: PointerEvent
let position: Vector2
let canvasPosition: Vector2

const getCanvasPosition = (): Readonly<Vector2> =>
{
    if (!moveEvent)
    {
        return canvasPosition
    }

    const settings = get(storeSettings)

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

    const settings = get(storeSettings)

    position.set(
        moveEvent.clientX / settings.width * 2 - 1,
        1 - moveEvent.clientY / settings.height * 2
    )

    return position
}

const init = (): void =>
{
    position = new Vector2()
    canvasPosition = new Vector2()

    clickEvent = null
    clickPending = false
    clicked = false
}

const setClickEvent = (event: PointerEvent): void =>
{
    clickEvent = event
    clickPending = true
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
    init,
    setClickEvent,
    setMoveEvent,
    update
}
