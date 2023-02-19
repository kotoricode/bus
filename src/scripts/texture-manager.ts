import { get } from "svelte/store"
import type { Texture } from "three"
import { store } from "./store"

const textures = new Map<string, Texture>()

const getNamedTexture = (textureId: string): Texture =>
{
    const texture = textures.get(textureId)

    if (!texture)
    {
        throw Error(`Texture not found: ${textureId}`)
    }

    return texture
}

const setNamedTexture = (textureId: string, texture: Texture): void =>
{
    const existing = textures.get(textureId)

    if (texture !== existing)
    {
        if (existing)
        {
            existing.dispose()
        }

        textures.set(textureId, texture)
    }

    const settings = get(store.settings)
    updateAnisotropy(texture, settings.anisotropy)
}

const updateAnisotropy = (texture: Texture, anisotropy: number): void =>
{
    if (texture.anisotropy !== anisotropy)
    {
        texture.anisotropy = anisotropy
        texture.needsUpdate = true
    }
}

store.settings.subscribe(value =>
{
    for (const texture of textures.values())
    {
        updateAnisotropy(texture, value.anisotropy)
    }
})

export const textureManager = <const>{
    getNamedTexture,
    setNamedTexture
}
