// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const gameContainer = document.getElementById('game-container');
    const portfolioContainer = document.getElementById('portfolio-container');
    const msgElement = document.getElementById('game-message');
    const skipBtn = document.getElementById('skip-btn');
    
    // --- Audio Setup ---
    // Using Howler.js for simple audio management
    const sounds = {
        kick: new Howl({ src: ['https://actions.google.com/sounds/v1/foley/kick_drum_heavy.ogg'], volume: 0.5 }),
        goal: new Howl({ src: ['https://actions.google.com/sounds/v1/crowds/crowd_cheer_large.ogg'], volume: 0.7 }),
        whistle: new Howl({ src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'], volume: 0.4 })
    };

    // --- Matter.js Setup ---
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Constraint = Matter.Constraint,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Events = Matter.Events,
          Vector = Matter.Vector;

    // Create engine
    const engine = Engine.create();
    engine.world.gravity.y = 0; // Top-down perspective, no gravity

    // Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create renderer
    const render = Render.create({
        element: gameContainer,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent', // Let CSS handle the background
            pixelRatio: window.devicePixelRatio
        }
    });

    // Add particles overlay for premium feel
    const particles = document.createElement('div');
    particles.className = 'particles-overlay';
    gameContainer.appendChild(particles);

    // --- Game Objects ---
    
    // Boundaries
    const wallOptions = { isStatic: true, render: { fillStyle: 'rgba(255,255,255,0.1)' } };
    const ground = Bodies.rectangle(width / 2, height + 50, width * 2, 100, wallOptions);
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, wallOptions);
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, wallOptions);
    const topWall = Bodies.rectangle(width / 2, -50, width * 2, 100, wallOptions);

    // Goal Configuration
    const goalWidth = Math.min(width * 0.4, 250);
    const goalY = height * 0.15;
    const postOptions = { 
        isStatic: true, 
        restitution: 0.9, 
        render: { fillStyle: '#ffffff' } 
    };
    
    // Goal Posts
    const leftPost = Bodies.circle(width / 2 - goalWidth / 2, goalY, 8, postOptions);
    const rightPost = Bodies.circle(width / 2 + goalWidth / 2, goalY, 8, postOptions);
    
    // Back of the net
    const backNet = Bodies.rectangle(width / 2, goalY - 40, goalWidth, 10, {
        isStatic: true,
        restitution: 0.2,
        render: { fillStyle: 'rgba(255,255,255,0.3)' }
    });

    // Goal Sensor (Detects when ball enters the goal)
    const goalSensor = Bodies.rectangle(width / 2, goalY - 15, goalWidth - 20, 40, {
        isStatic: true,
        isSensor: true,
        render: { visible: false },
        label: 'goalSensor'
    });

    // The Football
    const startX = width / 2;
    const startY = height * 0.8;
    const ballRadius = Math.min(width * 0.05, 20);
    
    let ball = Bodies.circle(startX, startY, ballRadius, {
        restitution: 0.8, // Bouncy
        friction: 0.005,
        frictionAir: 0.02, // Slows down over time
        density: 0.05,
        render: {
            fillStyle: '#ffffff',
            strokeStyle: '#000000',
            lineWidth: 2
        },
        label: 'football'
    });

    // Slingshot Constraint
    let sling = Constraint.create({
        pointA: { x: startX, y: startY },
        bodyB: ball,
        stiffness: 0.05,
        damping: 0.1,
        render: {
            visible: true,
            lineWidth: 2,
            strokeStyle: 'rgba(255, 255, 255, 0.3)'
        }
    });

    Composite.add(engine.world, [
        ground, leftWall, rightWall, topWall,
        leftPost, rightPost, backNet, goalSensor,
        ball, sling
    ]);

    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false }
        }
    });
    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse; // Keep mouse in sync with render

    // Run engine & renderer
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // --- Game Logic ---
    let isFired = false;
    let gameState = 'playing'; // 'playing', 'won'

    // Slingshot firing mechanic
    Events.on(mouseConstraint, 'enddrag', function(e) {
        if (e.body === ball && !isFired) {
            // Check if pulled back far enough to fire
            const dist = Vector.magnitude(Vector.sub(ball.position, { x: startX, y: startY }));
            if (dist > 20) {
                isFired = true;
                sling.bodyB = null; // Break constraint
                sling.render.visible = false;
                sounds.kick.play();
            }
        }
    });

    // Reset logic if missed
    function resetBall(message) {
        if (gameState === 'won') return;
        
        showMessage(message, 'miss');
        
        // Reset physics
        isFired = false;
        Matter.Body.setPosition(ball, { x: startX, y: startY });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(ball, 0);
        
        // Re-attach slingshot
        sling.bodyB = ball;
        sling.render.visible = true;
    }

    // Monitor ball speed after firing to detect misses
    Events.on(engine, 'afterUpdate', function() {
        if (isFired && gameState === 'playing') {
            const speed = Vector.magnitude(ball.velocity);
            
            // If ball stops moving and didn't trigger goal
            if (speed < 0.1) {
                // Check if it's past the goal line but missed
                if (ball.position.y < startY - 50) {
                    resetBall("Almost there! Try again.");
                } else {
                    resetBall("Give it some more power!");
                }
            }
        }
    });

    // Collision detection (Goal & Posts)
    Events.on(engine, 'collisionStart', function(event) {
        const pairs = event.pairs;
        
        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA;
            const bodyB = pairs[i].bodyB;

            // Camera shake on post hit
            if ((bodyA === ball && (bodyB === leftPost || bodyB === rightPost)) ||
                (bodyB === ball && (bodyA === leftPost || bodyA === rightPost))) {
                triggerShake();
            }

            // Goal detection
            if ((bodyA === ball && bodyB === goalSensor) || 
                (bodyB === ball && bodyA === goalSensor)) {
                
                if (gameState !== 'won') {
                    triggerWin();
                }
            }
        }
    });

    // --- Polish & Effects ---

    function triggerShake() {
        gameContainer.classList.add('shake');
        setTimeout(() => gameContainer.classList.remove('shake'), 300);
    }

    function showMessage(text, type = 'success') {
        msgElement.textContent = text;
        msgElement.className = `show ${type}`;
        setTimeout(() => {
            msgElement.className = '';
        }, 2000);
    }

    function triggerWin() {
        gameState = 'won';
        sounds.whistle.play();
        setTimeout(() => sounds.goal.play(), 300);
        
        showMessage("GOAL! Spectacular Shot!", 'success');
        
        // Confetti explosion
        var duration = 3 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        var interval = setInterval(function() {
            var timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            var particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        // Unlock portfolio after delay
        setTimeout(unlockPortfolio, 2500);
    }

    function unlockPortfolio() {
        // Stop physics
        Runner.stop(runner);
        Render.stop(render);
        
        // Fade out game overlay
        gameContainer.classList.add('hidden');
        
        // Fade in portfolio and unlock scroll
        document.body.classList.remove('game-active');
        portfolioContainer.classList.add('unlocked');
    }

    // Skip Button Logic
    skipBtn.addEventListener('click', () => {
        if (gameState !== 'won') {
            unlockPortfolio();
        }
    });
});
