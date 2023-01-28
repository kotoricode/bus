<script lang="ts">
    import { settingsWidth, settingsHeight, fadeStore, loadingStore } from "../scripts/state"

    let messageShowable = true

    fadeStore.subscribe(value =>
    {
        if (value)
        {
            setTimeout(() =>
            {
                messageShowable = true
            }, 500)
        }
        else
        {
            messageShowable = false
        }
    })
</script>

<div
    style:width={$settingsWidth}px
    style:height={$settingsHeight}px
    class:inactive="{!$fadeStore}"
>
    {#if messageShowable && $loadingStore}
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
        transition: all 0.5s ease-out;
        pointer-events: none;
    }

    .inactive
    {
        opacity: 0;
    }
</style>
