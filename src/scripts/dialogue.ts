import type { DialogueLine, DialogueSprite } from "./types"

type Branch = (DialogueLine | DialogueSprite)[]

const test: Branch = [
    { type: "sprite", onLeft: true, fileName: "nagahisa_00.png" },
    { type: "sprite", onLeft: false, fileName: "nagahisa_00.png" },
    { type: "line", speaker: "char1", message: "message1 message1 message1 \
        message1 message1 message1 message1 message1 message1 message1 \
        message1 message1 message1 message1" },
    { type: "line", speaker: "char2", message: "message2" },
    { type: "line", speaker: "char3", message: "message3" }
]

export const dialogue = {
    test
} satisfies Record<string, Branch>
