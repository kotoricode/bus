import { storeLetterbox } from "../state"

export const eventLetterbox = (value: boolean): () => boolean =>
    (): boolean =>
    {
        storeLetterbox.set(value)

        return true
    }
