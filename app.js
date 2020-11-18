const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#scoreEl");
const gameOverScore = document.querySelector("#gameOverScore");
const highScoreEl = document.querySelector("#highScoreEl");

canvas.width = innerWidth; //window.innerWidth window object is automatic
canvas.height = innerHeight;

class Player {
  constructor(x, y, r, color) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = color;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Barrel extends Player {
  constructor(x, y, r, color) {
    super(x, y, r, color);
  }
}

class Projectile extends Player {
  constructor(x, y, r, color, v) {
    super(x, y, r, color); //same as Player
    this.v = v;
    this.bonus = 0;
  }

  update() {
    this.draw();
    this.x += this.v.x;
    this.y += this.v.y;
  }
}

class Enemy extends Projectile {
  constructor(x, y, r, color, v, enemyID) {
    super(x, y, r, color, v);
    this.ID = enemyID;
  }
}

const friction = 0.99;
class Particle extends Enemy {
  constructor(x, y, r, color, v) {
    super(x, y, r, color, v);
    this.alpha = 1;
  }
  drawParticle() {
    ctx.save(); //for particles
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  updateParticle() {
    this.drawParticle();
    this.v.x *= friction;
    this.v.y *= friction;
    this.x += this.v.x;
    this.y += this.v.y;
    this.alpha -= 0.01;
  }
}

const x0 = canvas.width / 2;
const y0 = canvas.height / 2;

const playerRadius = 10;
const chargedRadius = 12;
const normalColor = "white";
const chargedColor = "rgb(187, 98, 184)";

let player = new Player(x0, y0, playerRadius, normalColor);
let barrel = new Barrel(x0 + playerRadius, y0 + playerRadius, 2, normalColor);
let projectiles = [];
let particles = [];
let enemies = [];

const minSize = 8;
const maxSize = 30;
const projectile = new Projectile(x0, y0, 5, "white", { x: 1, y: 1 }); //contrast with screenX screenY

function init() {
  player = new Player(x0, y0, playerRadius, normalColor);
  barrel = new Barrel(x0 + playerRadius, y0 + playerRadius, 2, normalColor);
  projectiles = [];
  particles = [];
  enemies = [];
  score = 0;
  scoreEl.innerHTML = score;
  highScore = localStorage.getItem("hiScore");
  highScoreEl.innerHTML = highScore;
}

function spawnEnemies() {
  const r = Math.random() * (maxSize - minSize) + minSize; //Math.round(Math.random() * 2 + 1) * 10;
  const axis = Math.random();
  const x =
    axis < 0.5
      ? Math.random() < 0.5
        ? -r
        : canvas.width + r
      : Math.random() * canvas.width;
  const y =
    axis > 0.5
      ? Math.random() < 0.5
        ? -r
        : canvas.height + r
      : Math.random() * canvas.height;

  enemyColor = Math.random() * 360;
  while (enemyColor < 320 && enemyColor > 250) {
    //prevent purple-ish conflict with big projectile color
    enemyColor = Math.random() * 360;
  }
  const color = `hsl(${enemyColor}, 50%, 50%)`;
  const speed = 2;
  const dx = x0 - x;
  const dy = y0 - y;
  const ds = Math.hypot(dx, dy);
  const velocity = {
    x: (speed * dx) / ds,
    y: (speed * dy) / ds,
  };
  enemies.push(new Enemy(x, y, r, color, velocity, Math.random() * 100));
}

const gameActive = setInterval(spawnEnemies, 1000);

function endGame() {
  clearInterval(gameActive);
}

let animationID;
let score = 0;
let highScore = localStorage.getItem("hiScore");
highScoreEl.innerHTML = highScore;
function animate() {
  animationID = requestAnimationFrame(animate);
  let d2 = new Date();
  if (Math.ceil((d2.getTime() - chargedStart) / 100) + 4 > 12) {
    player.color = chargedColor;
    barrel.color = chargedColor;
    gsap.to(player, { r: chargedRadius, duration: 0.25 });
  }
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();
  barrel.draw();
  particles.forEach((particle, particleIndex) => {
    if (particle.alpha <= 0) {
      particles.splice(particleIndex, 1);
    } else {
      particle.updateParticle();
    }
  });
  projectiles.forEach((projectile, projectileIndex) => {
    projectile.update();
    if (
      projectile.x < 0 ||
      projectile.x > canvas.width ||
      projectile.y < 0 ||
      projectile.y > canvas.height
    ) {
      projectiles.splice(projectileIndex, 1);
    }
  });
  enemies.forEach((enemy, index) => {
    enemy.update();
    projectiles.forEach((projectile, projectileIndex) => {
      let enemyID = enemy.ID;
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (dist <= enemy.r + projectile.r + 1) {
        for (let i = 0; i < Math.min(enemy.r * 2, 15); i++) {
          //generate particle effects
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 1 + 1,
              enemy.color,
              {
                x: (Math.random() - 0.5) * Math.random() * 9,
                y: (Math.random() - 0.5) * Math.random() * 9,
              }
            )
          );
        }
        if (enemy.r - 10 > 8) {
          //shrink hit enemies
          gsap.to(enemy, {
            r: enemy.r - 10,
          });
          setTimeout(() => {
            if (projectile.r <= 12) {
              projectiles.splice(projectileIndex, 1);
            }
          }, 0);
        } else {
          //remove enemies
          setTimeout(() => {
            pos = enemies
              .map(function (e) {
                return e.ID;
              })
              .indexOf(enemyID);
            if (pos >= 0) enemies.splice(pos, 1);
            if (projectile.r <= 12) {
              projectiles.splice(projectileIndex, 1);
              score += 100;
            } else {
              //bonus for chained kills
              projectile.bonus++;
              score += 2 ** (projectile.bonus - 1) * 100;
            }
            scoreEl.innerHTML = score;
          }, 0);
        }
      }
    });
    if (Math.hypot(x0 - enemy.x, y0 - enemy.y) < enemy.r + player.r - 2) {
      //player is hit
      cancelAnimationFrame(animationID);
      modalEl.style.display = "flex";
      gameOverScore.innerHTML = score;
      if (score > highScore) {
        localStorage.setItem("hiScore", JSON.stringify(score));
        highScoreEl.innerHTML = score;
      }
    }
  });
}

let chargedStart;
addEventListener("mousedown", (e) => {
  if (e.button == 0) {
    let d = new Date();
    chargedStart = d.getTime();
  }
});

addEventListener("mouseup", (e) => {
  if (e.button == 0) {
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    const ds = Math.hypot(dx, dy);
    let d2 = new Date();
    const size = Math.min(
      Math.ceil((d2.getTime() - chargedStart) / 100) + 4,
      15
    );
    const r = size > 12 ? size : 5;

    const speed = r > 12 ? 4 : 5;
    const velocity = {
      x: (speed * dx) / ds,
      y: (speed * dy) / ds,
    };

    const projectile = new Projectile(
      x0,
      y0,
      r,
      r > 12 ? "purple" : "white",
      velocity
    );
    projectiles.push(projectile);

    gsap.to(player, { r: playerRadius, duration: 0.3 });
    player.color = normalColor;
    barrel.color = normalColor;
    d3 = new Date();
    chargedStart = d3.getTime() * 10;
  }
});

const coolDown = 2;
let lastBuck = new Date() - coolDown * 1000;
//right-click
addEventListener("contextmenu", (e) => {
  e.preventDefault();
  let d4 = new Date();
  if (d4 - lastBuck > coolDown * 1000) {
    lastBuck = new Date();
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    const angle = Math.atan2(dy, dx);
    const speed = 5;
    const velocities = [];
    const r = 4;
    const dtheta = Math.PI / 22.5;
    const angles = [angle - dtheta, angle, angle + dtheta];

    for (let i = 0; i < 3; i++) {
      velocities[i] = {
        x: speed * Math.cos(angles[i]),
        y: speed * Math.sin(angles[i]),
      };
    }

    for (let i = 0; i < 3; i++) {
      const projectile = new Projectile(x0, y0, r, "orchid", velocities[i]);
      projectiles.push(projectile);
    }
  }
});

addEventListener("mousemove", (e) => {
  const dx = e.clientX - x0;
  const dy = e.clientY - y0;
  const ds = Math.hypot(dx, dy);
  barrel.x = x0 + (dx / ds) * (playerRadius + 6);
  barrel.y = y0 + (dy / ds) * (playerRadius + 6);
});

const startBtn = document.querySelector("#startBtn");
const modalEl = document.querySelector("#modalEl");
startBtn.addEventListener("click", () => {
  init();
  animate();
  spawnEnemies();
  modalEl.style.display = "none";
});

// let gamePaused = true
// addEventListener("keydown", (e) => {
//   if (e.code === "Escape") {
//     if(gamePaused){
//       animate();
//       spawnEnemies();
//     } else{
//       cancelAnimationFrame(animationID);
//     }
//   }
// });
