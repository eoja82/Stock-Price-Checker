function hideExamples() {
  let x = document.getElementById("examples");
  x.style.display === "none" ? x.style.display = "block" : x.style.display = "none";
  x.style.display === "block" ?
    document.getElementById("showExamples").innerHTML = "Hide Examples" :
    document.getElementById("showExamples").innerHTML = "Show Examples"; 
};