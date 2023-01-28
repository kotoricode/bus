<script lang="ts">
    import {
        storeSamples, storeMaxSamples, storeAnisotropy,
        storeMaxAnisotropy, storeSettingsInitialized
    } from "../scripts/state"

    let bodyOpen = false

    const toggleBodyOpen = (): void =>
    {
        bodyOpen = !bodyOpen
    }
</script>

{#if $storeSettingsInitialized}
    <div id="settings">
        <div id="header" on:click|stopPropagation={toggleBodyOpen}>
            Settings
        </div>

        {#if bodyOpen}
            <div class="item">
                <div>
                    Multisampling
                </div>
                <select bind:value={$storeSamples}>
                    {#each {length: Math.log2($storeMaxSamples) + 1} as _, i}
                        <option value={2 ** i}>
                            {i ? `x${2 ** i}` : "off"}
                        </option>
                    {/each}
                </select>
            </div>
        
            <div class="item">
                <div>
                    Anisotropy
                </div>
                <select bind:value={$storeAnisotropy}>
                    {#each {length: Math.log2($storeMaxAnisotropy) + 1} as _, i}
                        <option value={2 ** i}>
                            {i ? `x${2 ** i}` : "off"}
                        </option>
                    {/each}
                </select>
            </div>
        {/if}
    </div>
{/if}

<style>
    #settings
    {
        background-color: aqua;
        width: fit-content;
        height: fit-content;
        opacity: 0.5;
        transition: opacity 0.05s linear;
    }

    #settings:hover
    {
        opacity: 1;
    }

    #settings > div
    {
        padding: 8px;
    }

    #header
    {
        cursor: pointer;
    }

    .item
    {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 200px;
    }

</style>
