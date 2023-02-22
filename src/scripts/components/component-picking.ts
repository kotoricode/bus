import { Vector2 } from "three"

export class ComponentPicking
{
    readonly color: number
    readonly uniform: Vector2
    private static nextChannelColor = 0

    constructor()
    {
        const channelColor = ComponentPicking.nextChannelColor
        ComponentPicking.nextChannelColor = ComponentPicking.nextChannelColor + 1 & 0xFF

        this.color = 0xffff00 + channelColor / 255
        this.uniform = new Vector2(0, channelColor / 255)
    }
}
