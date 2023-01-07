import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

export default {
    // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
    // for more information about preprocessors
    preprocess: vitePreprocess(),
    embedded: true,
    onwarn: (warning, handler) =>
    {
        if (!warning.code.startsWith("a11y"))
        {
            handler(warning)
        }
    },
}
