<script lang="ts">
    import { onDestroy } from "svelte"
    import { dialogue } from "../scripts/dialogue"
    import { dialogueBranch } from "../scripts/state"
    import { fly } from "svelte/transition"
    import { linear, quadOut } from "svelte/easing"
    import type { DialogueLine, DialogueSprite } from "../scripts/types"

    const fadeSlopeWidthDividend = 500
    const fadeSlopeWidthAdvanceDivisor = 10
    const boxMoveTime = 750
    const boxMoveDelay = 250
    const letterBoxBarHeight = 720 / 10

    let dialogueItem: DialogueLine | null = null
    let branch: (DialogueLine | DialogueSprite)[] | null = null
    let boxVisible = false
    let fadeStart = 0
    let fadeSlopeWidth = 0
    let spriteLeft: string | null
    let spriteRight: string | null

    const onClickDialogue = (): void =>
    {
        if (!branch || !dialogueItem || !boxVisible)
        {
            return
        }

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
        dialogueItem = item
        fadeSlopeWidth = fadeSlopeWidthDividend / (dialogueItem.message.length || 1)
        fadeStart = -fadeSlopeWidth
        updateFadeStyle()
        requestAnimationFrame(updateGradientSlope)
    }

    const nextItem = async (): Promise<void> =>
    {
        const next = branch?.shift()

        if (!next)
        {
            dialogueBranch.set(null)
    
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
                setTimeout(() => updateText(next), boxMoveDelay + boxMoveTime)
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

    const onBranchChange = (key: keyof typeof dialogue | null): void =>
    {
        if (key)
        {
            branch = dialogue[key].slice()
            setTimeout(nextItem, boxMoveDelay)
        }
        else
        {
            dialogueItem = null

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
    }

    const unsubscribe = dialogueBranch.subscribe(onBranchChange)
    onDestroy(unsubscribe)
</script>

{#if branch}
    <div
        id="letter-box-top"
        in:fly="{{ y: -letterBoxBarHeight, duration: 500, easing: linear }}"
        out:fly="{{ y: -letterBoxBarHeight, duration: 500, easing: linear }}"
    ></div>
    
    <div
        id="letter-box-bottom"
        in:fly="{{ y: letterBoxBarHeight, duration: 500, easing: linear }}"
        out:fly="{{ y: letterBoxBarHeight, duration: 500, easing: linear }}"
    ></div>

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
        in:fly="{{ delay: boxMoveDelay, y: 400, duration: boxMoveTime, easing: quadOut }}"
        out:fly="{{ delay: boxMoveDelay, y: 400, duration: boxMoveTime, easing: quadOut }}"
        class:cursor-pointer="{dialogueItem}"
        on:click={onClickDialogue}
    >
        {#if dialogueItem}
            <div
                id="speaker"
                class:char1="{dialogueItem.speaker === "char1"}"
                class:char2="{dialogueItem.speaker === "char2"}"
                class:char3="{dialogueItem.speaker === "char3"}"
            >
                {dialogueItem.speaker}
            </div>

            <span id="message">
                {dialogueItem.message}
                {#if fadeStart >= 100}
                    <span id="blinker">
                        &#9654;
                    </span>
                {/if}
            </span>
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
        padding: 24px;
        background-color: #fcfcff;
        font-family: 'Tauri', sans-serif;
    }

    #letter-box-top, #letter-box-bottom
    {
        width: 100%;
        background-color: #000;
    }

    #letter-box-top
    {
        top: 0;
        bottom: 90%;
    }

    #letter-box-bottom
    {
        bottom: 0;
        top: 90%;
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
        0%   { opacity: 1; }
        50%  { opacity: .1; }
        100% { opacity: 1; }
    }

    .cursor-pointer
    {
        cursor: pointer;
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
