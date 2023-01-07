import "./app.css"
import App from "./ui/App.svelte"

const target = document.getElementById("app")

if (!target)
{
    throw Error("Missing app element")
}

target.addEventListener("contextmenu", (event: MouseEvent) =>
{
    event.preventDefault()
})

new App({
    target
})
