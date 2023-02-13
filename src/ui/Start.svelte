<script lang="ts">
    import { storeSettings, storeInitialUserAction } from "../scripts/store"

    const onClick = (): void =>
    {
        storeInitialUserAction.set(true)
    }
</script>

<div
    on:click|once|trusted|stopPropagation={onClick}
    style:width={$storeSettings.width}px
    style:height={$storeSettings.height}px
>
    Click to start
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
        cursor: pointer;
    }
</style>
