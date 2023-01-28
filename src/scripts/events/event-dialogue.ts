import type { dialogue } from "../dialogue"
import { storeDialogue } from "../state"

export const eventDialogue = (dialogueId: keyof typeof dialogue): () => boolean =>
{
    let initialized = false
    let done = false

    return (): boolean =>
    {
        if (!initialized)
        {
            initialized = true
            storeDialogue.set(dialogueId)
            const unsubscribe = storeDialogue.subscribe(value =>
            {
                if (!value)
                {
                    done = true
                    unsubscribe()
                }
            })
        }

        return done
    }
}
