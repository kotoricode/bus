import { writable } from "svelte/store"
import type { sceneList } from "./scenes/scene-list"
import type { dialogue } from "./dialogue"

export const storeInitialUserAction = writable(false)

export const storeSettingsInitialized = writable(false)

export const storeMaxSamples = writable(1)

export const storeMaxAnisotropy = writable(1)

export const storeSamples = writable(1)

export const storeAnisotropy = writable(1)

export const storeWidth = writable(1280)

export const storeHeight = writable(720)

export const storeDialogue = writable<keyof typeof dialogue | null>(null)

export const storeFade = writable(true)

export const storeLoading = writable(false)

export const storeScene = writable<keyof typeof sceneList>("sceneWorld")

export const storeDebug = writable(true)

export const storeLetterbox = writable(false)
