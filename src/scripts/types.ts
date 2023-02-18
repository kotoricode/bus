import type { Writable } from "svelte/store"
import type { Scene } from "three"

export type GameScene =  Readonly<{
    scene: Scene
    update: () => void
}>

export type StoreValue<T> = T extends Writable<infer R> ? R : never
