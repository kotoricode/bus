<script lang="ts">
    import Settings from "./Settings.svelte"
    import Canvas from "./Canvas.svelte"
    import Dialogue from "./Dialogue.svelte"
    import Fade from "./Fade.svelte"
    import Start from "./Start.svelte"
    import Debug from "./Debug.svelte"
    import Letterbox from "./Letterbox.svelte"

    import { storeInitialUserAction } from "../scripts/store"
</script>

{#if $storeInitialUserAction}
    <Canvas/>
    <Fade/>
    <Letterbox/>
    <Settings/>
    <Debug/>
    <Dialogue/>
{:else}
    <Start/>
{/if}
