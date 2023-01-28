import type { Unsubscriber } from "svelte/store"
import type { dialogue } from "../dialogue"
import { storeDialogue } from "../state"
import { EventBase } from "./event-base"

export class EventDialogue extends EventBase
{
    private initialized = false
    private unsubscribe: Unsubscriber | null = null

    constructor(private dialogueId: keyof typeof dialogue)
    {
        super()
    }

    override run(): void
    {
        if (!this.initialized)
        {
            this.initialized = true
            storeDialogue.set(this.dialogueId)
            this.unsubscribe = storeDialogue.subscribe(value =>
            {
                if (!value && this.unsubscribe)
                {
                    this.done = true
                    this.unsubscribe()
                }
            })
        }
    }
}
