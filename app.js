const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

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
  }

  update() {
    this.draw();
    this.x += this.v.x;
    this.y += this.v.y;
  }
}

class Enemy extends Projectile {
  constructor(x, y, r, color, v) {
    super(x, y, r, color, v);
  }
}

const x0 = canvas.width / 2;
const y0 = canvas.height / 2;

const playerRadius = 10;
const chargedRadius = 8;
const normalColor = "white";
const chargedColor = "rgb(187, 98, 184)";

const player = new Player(x0, y0, playerRadius, normalColor);
const barrel = new Barrel(x0 + playerRadius, y0 + playerRadius, 2, normalColor);

const projectile = new Projectile(x0, y0, 5, "white", { x: 1, y: 1 }); //contrast with screenX screenY
const projectiles = [];
const enemies = [];

function spawnEnemies() {
  setInterval(() => {
    const r = Math.random() * (30 - 4) + 4;
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
    enemies.push(new Enemy(x, y, r, color, velocity));
  }, 1000);
}

let animationID;
function animate() {
  animationID = requestAnimationFrame(animate);
  let d2 = new Date();
  if (Math.ceil((d2.getTime() - chargedStart) / 100) + 4 > 12) {
    player.r = chargedRadius;
    player.color = chargedColor;
    barrel.color = chargedColor;
  }
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();
  barrel.draw();
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
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (dist <= enemy.r + projectile.r + 1) {
        setTimeout(() => {
          //wait next frame remove
          enemies.splice(index, 1);
          if (projectile.r <= 12) {
            projectiles.splice(projectileIndex, 1);
          }
        });
      }
    });
    if (Math.hypot(x0 - enemy.x, y0 - enemy.y) < enemy.r + player.r - 2) {
      cancelAnimationFrame(animationID);
    }
  });
}

spawnEnemies();

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
    const r = Math.min(Math.ceil((d2.getTime() - chargedStart) / 100) + 4, 15);
    //   console.log(r);

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
    player.r = playerRadius;
    player.color = normalColor;
    barrel.color = normalColor;
    d3 = new Date();
    chargedStart = d3.getTime() * 10;
  }
});

const coolDown = 2;
let lastBuck = new Date() - coolDown * 1000;
//right-click
// ***still has weird collision
addEventListener("contextmenu", (e) => {
  e.preventDefault();
  let d4 = new Date();
  console.log(d4 - lastBuck);
  if (d4 - lastBuck > coolDown * 1000) {
    lastBuck = new Date();
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    const angle = Math.atan2(dy, dx);
    const speed = 5;
    const velocities = [];
    const r = 4;
    const dtheta = Math.PI / 45;
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
  console.log("x:" + e.clientY);
  console.log("y:" + e.clientX);
  const ds = Math.hypot(dx, dy);
  barrel.x = x0 + (dx / ds) * (playerRadius + 6);
  barrel.y = y0 + (dy / ds) * (playerRadius + 6);
});

animate();
