import { store } from "../store"

export const eventLetterbox = (value: boolean): () => boolean =>
{
    return (): boolean =>
    {
        store.letterbox.set(value)

        return true
    }
}
