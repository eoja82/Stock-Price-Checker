const exampleButton = document.getElementById("exampleButton")
const examples = document.getElementById("examples")

exampleButton.addEventListener("click", hideExamples)

function hideExamples() {
  examples.style.display === "none" ? examples.style.display = "block" : examples.style.display = "none"
  examples.style.display === "block" ?
    exampleButton.innerHTML = "Hide Examples" :
    exampleButton.innerHTML = "Show Example Usage" 
}