import { get } from "svelte/store"
import type { WebGLRenderer } from "three"
import { store } from "./store"
import type { StoreValue } from "./types"

const settingsUuid = "bus-hBMV8R1yzK"

export const initSettings = (renderer: WebGLRenderer): void =>
{
    store.caps.set({
        anisotropy: renderer.capabilities.getMaxAnisotropy(),
        samples: renderer.capabilities.maxSamples
    })

    load()
    store.settings.subscribe(save)
    store.settingsInitialized.set(true)
}

const load = (): void =>
{
    let loaded: StoreValue<typeof store.settings>

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

    const settings = { ...get(store.settings) }
    const caps = get(store.caps)

    if (Number.isInteger(loaded.anisotropy) && caps.anisotropy >= loaded.anisotropy)
    {
        settings.anisotropy = loaded.anisotropy
    }

    if (Number.isInteger(loaded.samples) && caps.samples >= loaded.samples)
    {
        settings.samples = loaded.samples
    }

    store.settings.set(settings)
}

const save = (value: StoreValue<typeof store.settings>): void =>
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
