import type { WebGLRenderer, WebGLRenderTarget } from "three"

export type GameScene = Readonly<{
    init: () => Promise<void>
    render: (renderer: WebGLRenderer, renderTarget: WebGLRenderTarget | null) => void
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
