import { storeLetterbox } from "../state"

export const eventLetterbox = (value: boolean): () => boolean =>
{
    return (): boolean =>
    {
        storeLetterbox.set(value)

        return true
    }
}
