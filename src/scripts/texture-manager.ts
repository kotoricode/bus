import { get } from "svelte/store"
import {
    DataTexture, TextureLoader, Texture, RepeatWrapping, LinearFilter, MathUtils,
    LinearMipMapLinearFilter, sRGBEncoding
} from "three"
import { store } from "./store"

const getTexture = (id: string): Texture =>
{
    const texture = textures.get(id)

    if (!texture)
    {
        throw Error(`Texture not found: ${id}`)
    }

    return texture
}

const setTexture = (id: string, texture: Texture): void =>
{
    const existing = textures.get(id)

    if (texture !== existing)
    {
        if (existing)
        {
            existing.dispose()
        }

        textures.set(id, texture)
    }
}

const loader = new TextureLoader()
const textures = new Map<string, Texture>()

{
    const placeholderData = new Uint8Array(128 * 128 * 4)

    for (let i = 0; i < placeholderData.length; i += 4)
    {
        placeholderData[i]     = MathUtils.randInt(0, 255)
        placeholderData[i + 1] = MathUtils.randInt(0, 255)
        placeholderData[i + 2] = MathUtils.randInt(0, 255)
        placeholderData[i + 3] = 255
    }

    const texture = new DataTexture(placeholderData, 128, 128)
    texture.anisotropy = get(store.settings).anisotropy
    texture.minFilter = LinearMipMapLinearFilter
    texture.magFilter = LinearFilter
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.encoding = sRGBEncoding
    texture.generateMipmaps = true
    texture.needsUpdate = true

    textures.set("placeholder", texture)
}

store.settings.subscribe(value =>
{
    for (const texture of textures.values())
    {
        texture.anisotropy = value.anisotropy
        texture.needsUpdate = true
    }
})

export const textureManager = <const>{
    getTexture,
    setTexture
}
