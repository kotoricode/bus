<script lang="ts">
    import { get } from "svelte/store"
    import { fadeStore, dialogueBranch, debugStore, letterboxStore } from "../scripts/state"

    const onDialogue = (): void =>
    {
        dialogueBranch.set("test")
    }

    const onLetterbox = (): void =>
    {
        const value = get(letterboxStore)
        letterboxStore.set(!value)
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
