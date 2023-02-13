import { writable } from "svelte/store"
import type { sceneList } from "./scenes/scene-list"
import type { dialogue } from "./dialogue"

export const store = {
    initialUserAction: writable(false),
    settingsInitialized: writable(false),
    caps: writable({
        anisotropy: 1,
        samples: 1
    }),
    settings: writable({
        anisotropy: 1,
        samples: 1,
        width: 1280,
        height: 720
    }),
    dialogue: writable<keyof typeof dialogue | null>(null),
    fade: writable(true),
    loading: writable(false),
    scene: writable<keyof typeof sceneList>("sceneWorld"),
    debug: writable(true),
    letterbox: writable(false)
}
