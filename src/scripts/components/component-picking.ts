import { MeshBasicMaterial } from "three"

export class ComponentPicking
{
    readonly colorMaterial: MeshBasicMaterial
    readonly color: number
    private static nextChannelColor = 0

    constructor()
    {
        const channelColor = ComponentPicking.nextChannelColor
        ComponentPicking.nextChannelColor = ComponentPicking.nextChannelColor + 1 & 0xFF

        this.color = 0xffff00 + channelColor

        this.colorMaterial = new MeshBasicMaterial({
            color: this.color,
            fog: false,
            transparent: false
        })
    }
}
