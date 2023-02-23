export class ComponentPicking
{
    readonly color: number
    readonly uniform: number
    private static nextChannelColor = 1

    constructor(blocker = false)
    {
        if (blocker)
        {
            this.color = 0xffff00
            this.uniform = 0
        }
        else
        {
            const channelColor = ComponentPicking.nextChannelColor
            ComponentPicking.nextChannelColor = Math.min(1, ComponentPicking.nextChannelColor + 1 & 0xFF)

            this.color = 0xffff00 + channelColor
            this.uniform = channelColor / 255
        }
    }
}
