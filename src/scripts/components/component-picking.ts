import { MeshBasicMaterial } from "three"

export class ComponentPicking
{
    readonly colorMaterial: MeshBasicMaterial
    private static nextChannelColor = 0

    constructor()
    {
        const channelColor = ComponentPicking.nextChannelColor
        ComponentPicking.nextChannelColor = ComponentPicking.nextChannelColor + 1 & 0xFF

        const color = (channelColor << 16) + (channelColor << 8) + channelColor

        this.colorMaterial = new MeshBasicMaterial({
            color,
            fog: false,
            transparent: false
        })
    }
}
