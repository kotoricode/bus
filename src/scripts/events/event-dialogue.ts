import type { dialogue } from "../dialogue"
import { store } from "../store"

export const eventDialogue = (dialogueId: keyof typeof dialogue): () => boolean =>
{
    let initialized = false
    let done = false

    return (): boolean =>
    {
        if (!initialized)
        {
            initialized = true
            store.dialogue.set(dialogueId)
            const unsubscribe = store.dialogue.subscribe(value =>
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
