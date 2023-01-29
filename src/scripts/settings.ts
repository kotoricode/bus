import { get } from "svelte/store"
import type { WebGLRenderer } from "three"
import {
    storeMaxAnisotropy, storeSettingsInitialized, storeMaxSamples, storeAnisotropy,
    storeSamples
} from "./state"

const settingsUuid = "bus-hBMV8R1yzK"

const init = (renderer: WebGLRenderer): void =>
{
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
    const maxSamples = renderer.capabilities.maxSamples

    storeMaxAnisotropy.set(maxAnisotropy)
    storeMaxSamples.set(maxSamples)

    load()
    storeAnisotropy.subscribe(save)
    storeSamples.subscribe(save)
}

const load = (): void =>
{
    let loaded: { [key: string]: number }

    try
    {
        const json = localStorage.getItem(settingsUuid)

        if (!json)
        {
            return
        }

        loaded = JSON.parse(json)
    }
    catch
    {
        console.error("Failed to load settings")

        return
    }

    if (Number.isInteger(loaded.anisotropy))
    {
        const maxAnisotropy = get(storeMaxAnisotropy)

        if (maxAnisotropy >= loaded.anisotropy)
        {
            storeAnisotropy.set(loaded.anisotropy)
        }
    }

    if (Number.isInteger(loaded.samples))
    {
        const maxSamples = get(storeMaxSamples)

        if (maxSamples >= loaded.samples)
        {
            storeSamples.set(loaded.samples)
        }
    }
}

const save = (): void =>
{
    try
    {
        const json = JSON.stringify({
            anisotropy: get(storeAnisotropy),
            samples: get(storeSamples)
        })

        localStorage.setItem(settingsUuid, json)
    }
    catch
    {
        console.error("Failed to save settings")
    }
}

export const settings = <const>{
    init
}
