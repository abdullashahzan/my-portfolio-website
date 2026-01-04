const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
// In view → zoom in + clear
entry.target.classList.add("clear");
entry.target.classList.add("active");
} else {
// Out of view → blur & fade again
entry.target.classList.remove("clear");
}
});
}, {
threshold: 0.2,               // triggers earlier (30% visible)
rootMargin: "0px 0px -100px 0px"
});
document.querySelectorAll('.hidden').forEach(el => observer.observe(el));
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
let w, h, scrollY = 0;
function resize() {
const dpr = window.devicePixelRatio || 1;
w = window.innerWidth;
h = window.innerHeight;
// Set canvas size in actual device pixels
canvas.width = w * dpr;
canvas.height = h * dpr;
// Keep the CSS size the same
canvas.style.width = w + "px";
canvas.style.height = h + "px";
// Scale drawing operations
ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform before scaling
ctx.scale(dpr, dpr);
}
window.addEventListener("resize", resize);
resize();
window.addEventListener("scroll", () => {
scrollY = window.scrollY * 0.01; // scroll effect
});
function draw() {
ctx.clearRect(0, 0, w, h);
// number of lines (fibers)
const lines = 7;
const spacing = 90; // distance between lines
for (let j = 0; j < lines; j++) {
ctx.beginPath();
ctx.strokeStyle = "black";
ctx.lineWidth = 0.3; // still works after scaling
for (let x = 0; x < w; x++) {
let y =
h / 2 +
(j - lines / 2) * spacing +
Math.sin(x * 0.02 + scrollY + j) * 40 +
x * 0.05; // slant direction
if (x === 0) ctx.moveTo(x, y);
else ctx.lineTo(x, y);
}
ctx.stroke();
}
requestAnimationFrame(draw);
}
draw();
const img = document.getElementById('profile-img');
window.addEventListener('scroll', () => {
const scrollY = window.scrollY;
const moveX = scrollY * 0.2;
img.style.transform = `translateX(${moveX}px)`;
});
// Parallax elements
const parallaxElements = document.querySelectorAll('.ppx, .ppy, .pnx, .pny');
// Maximum translation in pixels
const maxTranslate = 70; // adjust as needed
window.addEventListener('scroll', () => {
const scrollY = window.scrollY;
parallaxElements.forEach(el => {
if (el.classList.contains('ppx')) {
// move right but limit
el.style.transform = `translateX(${Math.min(scrollY * 0.3, maxTranslate)}px)`;
}
if (el.classList.contains('pnx')) {
// move left but limit
el.style.transform = `translateX(${Math.max(-scrollY * 0.3, -maxTranslate)}px)`;
}
if (el.classList.contains('ppy')) {
// move down but limit
el.style.transform = `translateY(${Math.min(scrollY * 0.3, maxTranslate)}px)`;
}
if (el.classList.contains('pny')) {
// move up but limit
el.style.transform = `translateY(${Math.max(-scrollY * 0.3, -maxTranslate)}px)`;
}
});
});
function toggleFullscreen(img) {
const overlay = document.getElementById("overlay");
const fullscreenImg = document.getElementById("fullscreen-img");
fullscreenImg.src = img.src;
overlay.style.display = "flex";
}
function closeFullscreen() {
document.getElementById("overlay").style.display = "none";
}
document.addEventListener("keydown", function(e) {
if (e.key === "Escape") { closeFullscreen(); }
});



