<script lang="ts">
    import {
        settingsWidth, settingsHeight, initialUserAction
    } from "../scripts/state"

    const onClick = (): void =>
    {
        initialUserAction.set(true)
    }
</script>

<div
    on:click|once|trusted|stopPropagation={onClick}
    style:width={$settingsWidth}px
    style:height={$settingsHeight}px
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
