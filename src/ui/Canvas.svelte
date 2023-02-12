<script lang="ts">
    import { onDestroy, onMount } from "svelte"
    import { mouse } from "../scripts/mouse"
    import { game } from "../scripts/game"
    import { storeSettings } from "../scripts/state"

    let canvas: HTMLCanvasElement

    const onClick = (event: MouseEvent): void =>
    {
        mouse.setEvent(<PointerEvent>event)
    }

    onMount(() =>
    {
        game.init(canvas)
    })

    onDestroy(() =>
    {
        game.destroy()
    })
</script>

<canvas
    bind:this={canvas}
    on:click|stopPropagation={onClick}
    width={$storeSettings.width}
    height={$storeSettings.height}
    style:width={$storeSettings.width}px
    style:height={$storeSettings.height}px
></canvas>
