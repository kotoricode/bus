<script lang="ts">
    import { onDestroy, onMount } from "svelte"
    import { mouse } from "../scripts/mouse"
    import { createGame } from "../scripts/game"
    import { storeSettings } from "../scripts/store"

    let canvas: HTMLCanvasElement
    let disposeGame: () => void | null

    const onClick = (event: MouseEvent): void =>
    {
        mouse.setClickEvent(<PointerEvent>event)
    }

    const onMove = (event: PointerEvent): void =>
    {
        mouse.setMoveEvent(event)
    }

    onMount(() =>
    {
        disposeGame = createGame(canvas)
    })

    onDestroy(() =>
    {
        disposeGame?.()
    })
</script>

<canvas
    bind:this={canvas}
    on:click|stopPropagation={onClick}
    on:pointermove={onMove}
    width={$storeSettings.width}
    height={$storeSettings.height}
    style:width={$storeSettings.width}px
    style:height={$storeSettings.height}px
></canvas>
