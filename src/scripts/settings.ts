import { get } from "svelte/store"
import type { WebGLRenderer } from "three"
import { storeCaps, storeSettings, storeSettingsInitialized } from "./state"
import type { StoreValue } from "./types"

const settingsUuid = "bus-hBMV8R1yzK"

export const initSettings = (renderer: WebGLRenderer): void =>
{
    storeCaps.set({
        anisotropy: renderer.capabilities.getMaxAnisotropy(),
        samples: renderer.capabilities.maxSamples
    })

    load()
    storeSettings.subscribe(save)
    storeSettingsInitialized.set(true)
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

    const settings = { ...get(storeSettings) }
    const caps = get(storeCaps)

    if (Number.isInteger(loaded.anisotropy) && caps.anisotropy >= loaded.anisotropy)
    {
        settings.anisotropy = loaded.anisotropy
    }

    if (Number.isInteger(loaded.samples) && caps.samples >= loaded.samples)
    {
        settings.samples = loaded.samples
    }

    storeSettings.set(settings)
}

const save = (value: StoreValue<typeof storeSettings>): void =>
{
    try
    {
        const json = JSON.stringify(value)
        localStorage.setItem(settingsUuid, json)
    }
    catch
    {
        console.error("Failed to save settings")
    }
}
