export type GameScene = Readonly<{
    init: () => Promise<void>
    update: () => void
}>

export type DialogueLine = {
    type: "line"
    speaker: string
    message: string
}

export type DialogueSprite = {
    type: "sprite"
    fileName: string
    onLeft: boolean
}

export type DialogueImage = {
    type: "image"
    fileName: string
}

export type DialogueBranch = (
    DialogueImage |
    DialogueLine |
    DialogueSprite
)[]
