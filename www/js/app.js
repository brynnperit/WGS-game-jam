require.config({
  baseUrl : 'js/lib',
  paths : {
    app : '../app'
  }
});

require(['sylvester'], function() {

  var minimumMonsterDistanceOnSpawn = 200;

  // Setup requestAnimationFrame
  requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

	function checkCollision( aabb1, aabb2 ) {
    return !(
      (aabb1.lowerLeft[1] < aabb2.upperRight[1]) ||
      (aabb1.upperRight[1] > aabb2.lowerLeft[1]) ||
      (aabb1.lowerLeft[0] > aabb2.upperRight[0]) ||
      (aabb1.upperRight[0] < aabb2.lowerLeft[0])
    );
  }

  // Create the canvas
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 480;
  document.body.appendChild(canvas);

  // Global font properties
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Background image
  var bgReady = false;
  var bgImage = new Image();
  bgImage.onload = function() {
    bgReady = true;
  };
  bgImage.src = "img/background.png";

  // Hero image
  var heroReady = false;
  var heroImage = new Image();
  heroImage.onload = function() {
    heroReady = true;
  };
  heroImage.src = "img/hero.png";

  // Monster image
  var monsterReady = false;
  var monsterImage = new Image();
  monsterImage.onload = function() {
    monsterReady = true;
  };
  monsterImage.src = "img/monster.png";

  // Bullet image
  var bulletReady = false;
  var bulletImage = new Image();
  bulletImage.onload = function() {
    bulletReady = true;
  };
  bulletImage.src = "img/bullet1.png";

  // Game objects
  var hero = {
    speed : 256, // movement in pixels per second
    width : 32,
    height : 32,
    x : canvas.width / 2,
    y : canvas.height / 2
  };
  var monster = {};
  var monstersCaught = 0;
  var isDead = false;

  // mouse clicks fire bullets
  var clickedLocations = [];
  var bulletList = [];

  // Handle keyboard controls
  var keysDown = {};

  addEventListener("keydown", function(e) {
    if(isDead && e.keyCode == ENTER) {
      restart();
    }
    else {
      keysDown[e.keyCode] = true;
    }
  }, false);

  addEventListener("keyup", function(e) {
    delete keysDown[e.keyCode];
  }, false);
  
  canvas.addEventListener("click", function (e) {
    clickedLocations.push({
      x: e.clientX,
      y: e.clientY,
      time: e.timeStamp
    });
  }, false);

  // Reset the game when the player catches a monster
  var reset = function() {
    // Throw the monster somewhere on the screen randomly that's not within the
    // minimum spawn distance of the player
    do{
    monster.x = 32 + (Math.random() * (canvas.width - 64));
    monster.y = 32 + (Math.random() * (canvas.height - 64));
    }while(Math.sqrt(
      Math.pow(monster.x - hero.x, 2),
      Math.pow(monster.y - hero.y, 2))
      < minimumMonsterDistanceOnSpawn);
    
    bulletList = [];
    clickedLocations = [];

    // set up the font for the score    
    ctx.font = "24px Helvetica";
    ctx.fillStyle = "rgb(250, 250, 250)";

  };

  var ENTER = 13;
  var UP = 87; // W
  var DOWN = 83; // A
  var LEFT = 65; // S
  var RIGHT = 68; // D

  function renderDeath() {
    // For some reason, need to do this else the font isn't aliased
    ctx.drawImage(bgImage, 0, 0);

    ctx.font = "52px Helvetica";
    ctx.fillStyle = "rgb(75, 0, 0)";
    ctx.fillText("You Died", 150, 128);

    ctx.font = "32px Helvetica";
    ctx.fillStyle = "rgb(100, 25, 25)";
    ctx.fillText("But you caught " + monstersCaught + " goblins!",
                 80, 200);

    ctx.font = "20px Helvetica";
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillText("Hit enter to restart", 170, canvas.height - 100);
  }
  
  // Update game objects

  function update(modifier) {
    var heroMoveAmount = {x: 0, y: 0};
    if ( UP in keysDown) {// Player holding up
      heroMoveAmount.y -= hero.speed * modifier;
    }
    if ( DOWN in keysDown) {// Player holding down
      heroMoveAmount.y += hero.speed * modifier;
    }
    if ( LEFT in keysDown) {// Player holding left
      heroMoveAmount.x -= hero.speed * modifier;
    }
    if ( RIGHT in keysDown) {// Player holding right
      heroMoveAmount.x += hero.speed * modifier;
    }
    //This prevents the hero from moving faster diagonally than they can otherwise
    var maxMoveAmount = hero.speed * modifier;
    var actualMoveAmount = Math.sqrt(heroMoveAmount.x * heroMoveAmount.x + heroMoveAmount.y * heroMoveAmount.y);
    if (actualMoveAmount > maxMoveAmount){
      heroMoveAmount.x *= (maxMoveAmount/actualMoveAmount);
      heroMoveAmount.y *= (maxMoveAmount/actualMoveAmount);
    }

    hero.x += heroMoveAmount.x;
    hero.y += heroMoveAmount.y;

    // The player dies when moving off the left side of the screen,
    // this is just temporary until we get bullets
    if (hero.x < 0) {
      isDead = true;
    }

    // Constrain the hero to the screen
    if (hero.x < 0) {
      hero.x = 0;
    } else if (hero.x > canvas.width - hero.width) {
      hero.x = canvas.width - hero.width;
    }

    if (hero.y < 0) {
      hero.y = 0;
    } else if (hero.y > canvas.height - hero.height) {
      hero.y = canvas.height - hero.height;
    }

    var currentMouseEvent;

    //Handle the list of mouse events
    while(clickedLocations.length > 0) {
      currentMouseEvent = clickedLocations.pop();
      var bullet = {
        speedPPS: 200,
        directionVector: Vector.create([currentMouseEvent.x - hero.x,
                                        currentMouseEvent.y - hero.y]),
        x: hero.x,
        y: hero.y
      }; 

      bullet.directionVector =
        bullet.directionVector.toUnitVector().multiply(bullet.speedPPS);
      bulletList.push(bullet);
    }

    var i, currentBullet;
    for (i = 0; i < bulletList.length; ++ i) {
      currentBullet = bulletList[i];
      currentBullet.x += (currentBullet.directionVector.elements[0] * modifier);
      currentBullet.y += (currentBullet.directionVector.elements[1] * modifier);
      if (currentBullet.x < 0 || currentBullet.x > canvas.width ||
          currentBullet.y < 0 || currentBullet.y > canvas.height) {
        // this bullet is offscreen, ditch it
        bulletList.splice(i, 1);

      }
    }

    // Are they touching?
    if (hero.x <= (monster.x + 32) && 
        monster.x <= (hero.x + 32) && 
        hero.y <= (monster.y + 32) && 
        monster.y <= (hero.y + 32)) {

      monstersCaught++;
      reset();
    }

  };

  // Draw everything
  function render() {
    if (bgReady) {
      ctx.drawImage(bgImage, 0, 0);
    }

    if (heroReady) {
      ctx.drawImage(heroImage, hero.x, hero.y);
    }

    if (monsterReady) {
      ctx.drawImage(monsterImage, monster.x, monster.y);
    }

    var i, l, currentBullet;
    for (i = 0, l = bulletList.length; i < l; ++ i){
      currentBullet = bulletList[i];
      if (bulletReady) {
        ctx.drawImage(bulletImage, currentBullet.x - bulletImage.width/2, currentBullet.y - bulletImage.height/2);
      }
    }

    // Score
    ctx.fillText("Goblins caught: " + monstersCaught, 32, 32);
  };

  // The main game loop
  function main() {
    var now = Date.now();
    var delta = now - then;

    if(!isDead) {
      update(delta / 1000);
      render();

      then = now;
      requestAnimationFrame(main);
    }
    else {
      renderDeath();
    }
  };

  // Let's play this game!
  var then;
  function restart() {
    isDead = false;
    monstersCaught = 0;

    reset();
    then = Date.now();
    main();
  }
  restart();
});
