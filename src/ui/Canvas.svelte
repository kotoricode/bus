<script lang="ts">
    import { onMount, onDestroy } from "svelte"
    import { mouse } from "../scripts/mouse"
    import { quit, init } from "../scripts/game"
    import { settingsWidth, settingsHeight } from "../scripts/state"

    let canvas: HTMLCanvasElement

    onMount(() =>
    {
        init(canvas)
    })

    onDestroy(quit)
</script>

<canvas
    bind:this={canvas}
    on:click|stopPropagation={mouse.setEvent}
    width={$settingsWidth}
    height={$settingsHeight}
    style:width={$settingsWidth}px
    style:height={$settingsHeight}px
></canvas>
