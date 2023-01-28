import { writable } from "svelte/store"
import type { sceneList } from "./scenes/scene-list"
import type { dialogue } from "./dialogue"

export const state = <const>{
    transitionId: 0
}

export const initialUserAction = writable(false)

export const stateSettingsInitialized = writable(false)

export const capabilitiesMaxSamples = writable(1)

export const capabilitiesMaxAnisotropy = writable(1)

export const settingsSamples = writable(1)

export const settingsAnisotropy = writable(1)

export const settingsWidth = writable(1280)

export const settingsHeight = writable(720)

export const dialogueBranch = writable<keyof typeof dialogue | null>(null)

export const fadeStore = writable(true)

export const loadingStore = writable(false)

export const sceneStore = writable<keyof typeof sceneList>("sceneWorld")

export const debugStore = writable(true)

export const letterboxStore = writable(false)
