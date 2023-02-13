import type { Writable } from "svelte/store"

export type GameScene = Disposable & Readonly<{
    update: () => void
}>

export type StoreValue<T> = T extends Writable<infer R> ? R : never

export type Disposable = {
    dispose: () => void
}
