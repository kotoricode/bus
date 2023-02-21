import { writable } from "svelte/store"
import type { sceneList } from "./scenes/scene-list"
import type { dialogue } from "./dialogue"
import type { Entity } from "./entity"

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
    fadeAmount: writable(1),
    fadeTarget: writable<0 | 1>(1),
    loading: writable(false),
    scene: writable<keyof typeof sceneList>("sceneBoard"),
    debug: writable(true),
    letterbox: writable(false),
    pickedEntity: writable<Entity | null>(null)
}
