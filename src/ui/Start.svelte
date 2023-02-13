<script lang="ts">
    import { store } from "../scripts/store"

    const onClick = (): void =>
    {
        store.initialUserAction.set(true)
    }

    const { settings } = store
</script>

<div
    on:click|once|trusted|stopPropagation={onClick}
    style:width={$settings.width}px
    style:height={$settings.height}px
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
