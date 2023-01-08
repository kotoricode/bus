<script lang="ts">
    import {
        settingsWidth, settingsHeight, fadeStore, loading
    } from "../scripts/state"

    let faded = true
    let fullyFaded = false

    fadeStore.subscribe((value: boolean) =>
    {
        fullyFaded = false

        setTimeout(() =>
        {
            faded = value

            if (value)
            {
                setTimeout(() =>
                {
                    fullyFaded = true
                }, 500)
            }
        })
    })
</script>

<div
    style:width={$settingsWidth}px
    style:height={$settingsHeight}px
    class:inactive="{!faded}"
>
    {#if fullyFaded && $loading}
        Loading...
    {/if}
</div>

<style>
    div
    {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        background-color: #000;
        font-family: 'Tauri', sans-serif;
        opacity: 1;
        transition: all 0.5s linear;
        pointer-events: none;
    }

    .inactive
    {
        opacity: 0;
    }
</style>
