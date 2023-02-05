import { mouse } from "../mouse"

export const taskUpdateMouse = () =>
{
    return (): void =>
    {
        mouse.update()
    }
}
