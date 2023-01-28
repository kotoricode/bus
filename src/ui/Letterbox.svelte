<script lang="ts">
    import { onDestroy } from "svelte"
    import { letterboxStore } from "../scripts/state"
    import { fly } from "svelte/transition"
    import { quadOut } from "svelte/easing"

    const letterBoxBarHeight = 720 / 10
    let active = false

    const unsubscribe = letterboxStore.subscribe(value =>
    {
        active = value
    })

    onDestroy(unsubscribe)
</script>

{#if active}
    <div
        id="letter-box-top"
        in:fly="{{ y: -letterBoxBarHeight, duration: 500, easing: quadOut }}"
        out:fly="{{ y: -letterBoxBarHeight, duration: 500, easing: quadOut }}"
    ></div>

    <div
        id="letter-box-bottom"
        in:fly="{{ y: letterBoxBarHeight, duration: 500, easing: quadOut }}"
        out:fly="{{ y: letterBoxBarHeight, duration: 500, easing: quadOut }}"
    ></div>
{/if}

<style>
    #letter-box-top, #letter-box-bottom
    {
        width: 100%;
        background-color: #000;
    }

    #letter-box-top
    {
        top: 0;
        bottom: 90%;
    }

    #letter-box-bottom
    {
        bottom: 0;
        top: 90%;
    }
</style>
