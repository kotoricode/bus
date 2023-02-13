<script lang="ts">
    import Settings from "./Settings.svelte"
    import Canvas from "./Canvas.svelte"
    import Dialogue from "./Dialogue.svelte"
    import Fade from "./Fade.svelte"
    import Start from "./Start.svelte"
    import Debug from "./Debug.svelte"
    import Letterbox from "./Letterbox.svelte"

    import { store } from "../scripts/store"

    const { initialUserAction } = store
</script>

{#if $initialUserAction}
    <Canvas/>
    <Fade/>
    <Letterbox/>
    <Settings/>
    <Debug/>
    <Dialogue/>
{:else}
    <Start/>
{/if}
