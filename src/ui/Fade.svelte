<script lang="ts">
    import { storeSettings, storeFade, storeLoading } from "../scripts/state"

    let messageShowable = true

    storeFade.subscribe(value =>
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
    style:width={$storeSettings.width}px
    style:height={$storeSettings.height}px
    class:inactive="{!$storeFade}"
>
    {#if messageShowable && $storeLoading}
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
