import type { Texture } from "three"
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

const textures = new Map<string, Texture>()

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
