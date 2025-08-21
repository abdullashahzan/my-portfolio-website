const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // In view → zoom in + clear
      entry.target.classList.add("clear");
    } else {
      // Out of view → blur & fade again
      entry.target.classList.remove("clear");
    }
  });
}, {
  threshold: 0.3,               // triggers earlier (30% visible)
  rootMargin: "0px 0px -100px 0px"
});

document.querySelectorAll('.hidden').forEach(el => observer.observe(el));

const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
let w, h, scrollY = 0;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

window.addEventListener("scroll", () => {
  scrollY = window.scrollY * 0.01; // scroll effect
});

function draw() {
  ctx.clearRect(0,0,w,h);

  // number of lines (fibers)
  const lines = 20;
  const spacing = 70; // distance between lines

  for(let j = 0; j < lines; j++) {
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0.1;

    for(let x = 0; x < w; x++) {
      // angled wave: add slope with (x * 0.1)
      let y = (h/2 + (j - lines/2) * spacing) 
              + Math.sin((x * 0.02) + scrollY + j) * 40
              + x * 0.05; // slant direction
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}
draw();