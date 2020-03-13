function hideExamples() {
  let x = document.getElementById("examples");
  x.style.display === "none" ? x.style.display = "block" : x.style.display = "none";
  x.style.display === "block" ?
    document.getElementById("exampleButton").innerHTML = "Hide Examples" :
    document.getElementById("exampleButton").innerHTML = "Show Examples"; 
};