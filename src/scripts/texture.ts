import { get } from "svelte/store"
import {
    DataTexture, TextureLoader, Texture, RepeatWrapping, LinearFilter, MathUtils,
    LinearMipMapLinearFilter, sRGBEncoding
} from "three"
import { settingsAnisotropy } from "./state"

const loader = new TextureLoader()

const textures = new Map<string, Texture>()

const init = (): void =>
{
    settingsAnisotropy.subscribe(setAnisotropy)

    const placeholderData = new Uint8Array(128 * 128 * 4)

    for (let i = 0; i < placeholderData.length; i += 4)
    {
        placeholderData[i]     = MathUtils.randInt(0, 255)
        placeholderData[i + 1] = MathUtils.randInt(0, 255)
        placeholderData[i + 2] = MathUtils.randInt(0, 255)
        placeholderData[i + 3] = 255
    }

    createDataTexture("placeholder", placeholderData, 128, 128)
}

const createDataTexture = (id: string, array: Uint8Array, width: number, height: number): string =>
{
    const texture = new DataTexture(array, width, height)
    texture.anisotropy = get(settingsAnisotropy)
    texture.minFilter = LinearMipMapLinearFilter
    texture.magFilter = LinearFilter
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.encoding = sRGBEncoding
    texture.generateMipmaps = true
    texture.needsUpdate = true

    textures.set(id, texture)

    return id
}

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

const setAnisotropy = (value: number): void =>
{
    for (const texture of textures.values())
    {
        texture.anisotropy = value
        texture.needsUpdate = true
    }
}

export const textureManager = <const>{
    getTexture,
    init,
    setTexture
}
