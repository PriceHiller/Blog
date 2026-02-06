// Marks images as "loaded" so animations and other things in CSS can react and
// remove animations
function markLoaded(img: HTMLImageElement) {
  img.classList.add("loaded");
}

document.querySelectorAll("img").forEach((img) => {
  if (img.complete) {
    markLoaded(img);
  } else {
    img.addEventListener("load", (_) => {
      markLoaded(img);
    });
  }
});
