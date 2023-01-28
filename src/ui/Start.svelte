<script lang="ts">
    import { storeWidth, storeHeight, storeInitialUserAction } from "../scripts/state"

    const onClick = (): void =>
    {
        storeInitialUserAction.set(true)
    }
</script>

<div
    on:click|once|trusted|stopPropagation={onClick}
    style:width={$storeWidth}px
    style:height={$storeHeight}px
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
