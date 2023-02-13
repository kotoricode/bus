<script lang="ts">
    import { onDestroy } from "svelte"
    import { dialogue, type DialogueBranch, type DialogueLine } from "../scripts/dialogue"
    import { store } from "../scripts/store"
    import { fly } from "svelte/transition"
    import { quadOut } from "svelte/easing"

    const fadeSlopeWidthDividend = 500
    const fadeSlopeWidthAdvanceDivisor = 10
    const boxMoveTime = 1000

    let line: DialogueLine | null = null
    let branch: DialogueBranch | null = null
    let boxVisible = false
    let fadeStart = 0
    let fadeSlopeWidth = 0
    let spriteLeft: string | null
    let spriteRight: string | null

    const onClickDialogue = (): void =>
    {
        if (fadeStart < 100)
        {
            fadeStart = 100
        }
        else
        {
            nextItem()
        }
    }

    const updateText = (item: DialogueLine): void =>
    {
        line = item
        fadeSlopeWidth = fadeSlopeWidthDividend / (line.message.length || 1)
        fadeStart = -fadeSlopeWidth
        updateFadeStyle()
        requestAnimationFrame(updateGradientSlope)
    }

    const nextItem = async (): Promise<void> =>
    {
        const next = branch?.shift()

        if (!next)
        {
            store.dialogue.set(null)
    
            return
        }

        if (next.type === "line")
        {
            if (boxVisible)
            {
                updateText(next)
            }
            else
            {
                boxVisible = true
                setTimeout(() => updateText(next), boxMoveTime)
            }
        }
        else if (next.type === "sprite")
        {
            if (next.onLeft)
            {
                spriteLeft = next.fileName
            }
            else
            {
                spriteRight = next.fileName
            }

            nextItem()
        }
    }

    const updateGradientSlope = (): void =>
    {
        const advance = fadeSlopeWidth / fadeSlopeWidthAdvanceDivisor
        fadeStart = Math.min(fadeStart + advance, 100)
        updateFadeStyle()

        if (fadeStart < 100)
        {
            requestAnimationFrame(updateGradientSlope)
        }
    }

    const updateFadeStyle = (): void =>
    {
        document.documentElement.style.setProperty(
            "--fadeStart",
            `#000F ${fadeStart}%`
        )

        document.documentElement.style.setProperty(
            "--fadeEnd",
            `#0000 ${fadeStart + fadeSlopeWidth}%`
        )
    }

    const unsubscribe = store.dialogue.subscribe(key =>
    {
        if (key)
        {
            branch = dialogue[key].slice()
            requestAnimationFrame(nextItem)
        }
        else
        {
            line = null

            requestAnimationFrame(() =>
            {
                branch = null
                boxVisible = false
                spriteLeft = null
                spriteRight = null
                fadeStart = 0
                fadeSlopeWidth = 0
                updateFadeStyle()
            })
        }
    })

    onDestroy(unsubscribe)
</script>

{#if branch}
    {#if spriteLeft}
        <img
            id="sprite-left"
            src="./images/{spriteLeft}"
            draggable="false"
            in:fly="{{ x: -400, duration: 1000, easing: quadOut }}"
            out:fly="{{ x: -400, duration: 1000, easing: quadOut }}"
        >
    {/if}

    {#if spriteRight}
        <img
            id="sprite-right"
            src="./images/{spriteRight}"
            draggable="false"
            in:fly="{{ x: 400, duration: 1000, easing: quadOut }}"
            out:fly="{{ x: 400, duration: 1000, easing: quadOut }}"
        >
    {/if}

    <div
        id="box"
        in:fly="{{ y: 400, duration: boxMoveTime, easing: quadOut }}"
        out:fly="{{ y: 400, duration: boxMoveTime, easing: quadOut }}"
    >
        {#if line}
            <div id="box-click" on:click={onClickDialogue}>
                <div id="box-text">
                    <div
                        id="speaker"
                        class:char1="{line.speaker === "char1"}"
                        class:char2="{line.speaker === "char2"}"
                        class:char3="{line.speaker === "char3"}"
                    >
                        {line.speaker}
                    </div>

                    <span id="message">
                        {line.message}
                        {#if fadeStart >= 100}
                            <span id="blinker">
                                &#9654;
                            </span>
                        {/if}
                    </span>
                </div>
            </div>
        {/if}
    </div>
{/if}

<style>
    :root
    {
        --fadeStart: #112f 0%;
        --fadeEnd: #1120 0%;
    }

    #box
    {
        top: 64%;
        bottom: 3%;
        left: 15%;
        right: 15%;
        background-color: #fcfcff;
        font-family: 'Tauri', sans-serif;
        pointer-events: none;
    }

    #box-click
    {
        width: 100%;
        height: 100%;
        cursor: pointer;
        pointer-events: all;
    }

    #box-text
    {
        height: calc(100% - 48px);
        padding: 24px;
    }

    #speaker
    {
        font-size: 32px;
        padding-bottom: 16px;
    }

    #message
    {
        font-size: 28px;
        line-height: 42px;
        background: linear-gradient(
            90deg,
            var(--fadeStart),
            var(--fadeEnd)
        );
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
    }

    #sprite-left, #sprite-right
    {
        bottom: 0;
    }

    #sprite-left
    {
        left: 7%;
    }

    #sprite-right
    {
        right: 7%;
    }

    #blinker
    {
        padding-left: 12px;
        animation: blinker 1.5s infinite linear;
        color: #000;
    }

    @keyframes blinker
    {
        0%   { opacity: 1;  }
        50%  { opacity: .1; }
        100% { opacity: 1;  }
    }

    .char1
    {
        color: red;
    }

    .char2
    {
        color: green;
    }

    .char3
    {
        color: blue;
    }
</style>
