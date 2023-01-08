<script lang="ts">
    import Settings from "./Settings.svelte"
    import Canvas from "./Canvas.svelte"
    import Dialogue from "./Dialogue.svelte"
    import Fade from "./Fade.svelte"
    import Start from "./Start.svelte"
    import Debug from "./Debug.svelte"

    import { initialUserAction } from "../scripts/state"
</script>

{#if $initialUserAction}
    <Canvas/>
    <Fade/>
    <Settings/>
    <Debug/>
    <Dialogue/>
{:else}
    <Start/>
{/if}
