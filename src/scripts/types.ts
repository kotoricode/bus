export type GameScene = Readonly<{
    init: () => Promise<void>
    update: () => void
}>

export type DialogueLine = Readonly<{
    type: "line"
    speaker: string
    message: string
}>

export type DialogueSprite = Readonly<{
    type: "sprite"
    fileName: string
    onLeft: boolean
}>

export type DialogueImage = Readonly<{
    type: "image"
    fileName: string
}>

export type DialogueBranch = (
    DialogueImage |
    DialogueLine |
    DialogueSprite
)[]
