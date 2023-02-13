<script lang="ts">
    import { get } from "svelte/store"
    import { eventDialogue } from "../scripts/events/event-dialogue"
    import { eventLetterbox } from "../scripts/events/event-letterbox"
    import { eventManager } from "../scripts/events/event-manager"
    import { storeFade, storeDebug, storeLetterbox } from "../scripts/store"

    const onDialogue = (): void =>
    {
        const event = eventDialogue("test")
        eventManager.add(event)
    }

    const onLetterbox = (): void =>
    {
        const value = get(storeLetterbox)
        const event = eventLetterbox(!value)
        eventManager.add(event)
    }

    const onFade = (): void =>
    {
        const value = get(storeFade)
        storeFade.set(!value)
    }

    const onLineToggle = (): void =>
    {
        const value = get(storeDebug)
        storeDebug.set(!value)
    }
</script>

<div>
    <button on:click={onDialogue}>dialogue</button>
    <button on:click={onLetterbox}>letterbox</button>
    <button on:click={onFade}>fade</button>
    <button on:click={onLineToggle}>debug</button>
</div>

<style>
    div
    {
        right: 0;
    }
</style>
