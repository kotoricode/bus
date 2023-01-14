import type { DialogueBranch } from "./types"

const test: DialogueBranch = [
    { type: "sprite", onLeft: true, fileName: "nagahisa_00.png" },
    { type: "sprite", onLeft: false, fileName: "nagahisa_00.png" },
    { type: "line", speaker: "char1", message: "message1 message1 message1 \
        message1 message1 message1 message1 message1 message1 message1 \
        message1 message1 message1 message1" },
    { type: "line", speaker: "char2", message: "message2" },
    { type: "line", speaker: "char3", message: "message3" }
]

export const dialogue = <const>{
    test
} satisfies Record<string, DialogueBranch>
