import { get } from "svelte/store"
import type { WebGLRenderer } from "three"
import {
    capabilitiesMaxAnisotropy, stateSettingsInitialized, capabilitiesMaxSamples,
    settingsAnisotropy, settingsSamples
} from "./state"

const settingsUuid = "bc3c3f1d-9b7a-44c4-a0cf-065459ad39c7"

const _settings = {
    anisotropy: 1,
    samples: 1
}

const init = (renderer: WebGLRenderer): void =>
{
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
    const maxSamples = renderer.capabilities.maxSamples

    capabilitiesMaxAnisotropy.set(maxAnisotropy)
    capabilitiesMaxSamples.set(maxSamples)

    load()

    stateSettingsInitialized.set(true)
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
        const maxAnisotropy = get(capabilitiesMaxAnisotropy)

        if (maxAnisotropy >= loaded.anisotropy)
        {
            settingsAnisotropy.set(loaded.anisotropy)
        }
    }

    if (Number.isInteger(loaded.samples))
    {
        const maxSamples = get(capabilitiesMaxSamples)

        if (maxSamples >= loaded.samples)
        {
            settingsSamples.set(loaded.samples)
        }
    }
}

const save = (): void =>
{
    try
    {
        const json = JSON.stringify(_settings)
        localStorage.setItem(settingsUuid, json)
    }
    catch
    {
        console.error("Failed to save settings")
    }
}

export const settings = <const>{
    init,
    load,
    save
}
