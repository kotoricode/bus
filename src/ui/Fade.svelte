<script lang="ts">
    import { store} from "../scripts/store"

    const { settings, loading, fadeAmount } = store
</script>

<div
    style:width={$settings.width}px
    style:height={$settings.height}px
    style:opacity={$fadeAmount}
>
    {#if $loading}
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
        pointer-events: none;
    }
</style>
