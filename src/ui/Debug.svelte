<script lang="ts">
    import { get } from "svelte/store"
    import { EventDialogue } from "../scripts/events/event-dialogue"
    import { EventLetterbox } from "../scripts/events/event-letterbox"
    import { eventManager } from "../scripts/events/event-manager"
    import { fadeStore, debugStore, letterboxStore } from "../scripts/state"

    const onDialogue = (): void =>
    {
        const event = new EventDialogue("test")
        eventManager.addEvent(event)
    }

    const onLetterbox = (): void =>
    {
        const value = get(letterboxStore)
        const event = new EventLetterbox(!value)
        eventManager.addEvent(event)
    }

    const onFade = (): void =>
    {
        const value = get(fadeStore)
        fadeStore.set(!value)
    }

    const onLineToggle = (): void =>
    {
        const value = get(debugStore)
        debugStore.set(!value)
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
