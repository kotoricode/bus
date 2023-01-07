import { state } from "../scripts/state"
import { EventBase } from "./event-base"

export class EventDialogue extends EventBase
{
    private initialized = false

    constructor(private dialogueId: string)
    {
        super()
    }

    override run(): void
    {
        // if (!this.initialized)
        // {
        //     this.initialized = true
        // }

        // if (state.dialogueFastForward)
        // {
        //     state.dialogueFastForward = false
        // }

        // if (state.dialogueEnd)
        // {
        //     state.dialogueEnd = false
        //     this.completed = true
        // }
    }
}
