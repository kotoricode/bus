<script lang="ts">
    import { store} from "../scripts/store"

    let messageShowable = true

    const { settings, loading, fade } = store

    fade.subscribe(value =>
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
    style:width={$settings.width}px
    style:height={$settings.height}px
    class:inactive="{!$fade}"
>
    {#if messageShowable && $loading}
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
