require.config({
  baseUrl: 'js/lib',
  paths: {
    app: '../app'
  }
});

// Setup requestAnimationFrame
requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||  
                        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "img/background.png";

// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
	heroReady = true;
};
heroImage.src = "img/hero.png";

// Monster image
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function () {
	monsterReady = true;
};
monsterImage.src = "img/monster.png";

// Game objects
var hero = {
	speed: 256, // movement in pixels per second
    width: 32,
    height: 32
};
var monster = {};
var monstersCaught = 0;

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

// Reset the game when the player catches a monster
var reset = function () {
	hero.x = canvas.width / 2;
	hero.y = canvas.height / 2;

	// Throw the monster somewhere on the screen randomly
	monster.x = 32 + (Math.random() * (canvas.width - 64));
	monster.y = 32 + (Math.random() * (canvas.height - 64));
};

var UP = 87;    // W
var DOWN = 83;  // A
var LEFT = 65;  // S
var RIGHT = 68; // D

// Update game objects
var update = function (modifier) {
  if (UP in keysDown) { // Player holding up
    hero.y -= hero.speed * modifier;
  }
  if (DOWN in keysDown) { // Player holding down
    hero.y += hero.speed * modifier;
  }
  if (LEFT in keysDown) { // Player holding left
    hero.x -= hero.speed * modifier;
  }
  if (RIGHT in keysDown) { // Player holding right
    hero.x += hero.speed * modifier;
  }

    if (hero.x < 0) {
        hero.x = 0;
    }
    else if (hero.x > canvas.width - hero.width) {
        hero.x = canvas.width - hero.width;
    }

    if (hero.y < 0) {
        hero.y = 0;
    }
    else if (hero.y > canvas.height - hero.height) {
        hero.y = canvas.height - hero.height;
    }
    

	// Are they touching?
	if (
		hero.x <= (monster.x + 32)
		&& monster.x <= (hero.x + 32)
		&& hero.y <= (monster.y + 32)
		&& monster.y <= (hero.y + 32)
	) {
		++monstersCaught;
		reset();
	}

    
};

// Draw everything
var render = function () {
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}

	if (heroReady) {
		ctx.drawImage(heroImage, hero.x, hero.y);
	}

	if (monsterReady) {
		ctx.drawImage(monsterImage, monster.x, monster.y);
	}

	// Score
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Goblins caught: " + monstersCaught, 32, 32);
};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;
	requestAnimationFrame(main);
};

// Let's play this game!
reset();
var then = Date.now();
main();
