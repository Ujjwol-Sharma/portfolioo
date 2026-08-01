// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    
    const gameWidget = document.getElementById('game-widget');
    const lockedSections = document.getElementById('locked-sections');
    const msgElement = document.getElementById('game-message');
    
    // --- Audio Setup ---
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

    const engine = Engine.create();
    engine.world.gravity.y = 0; // Top-down

    // Fixed dimensions for the embedded widget
    const width = 400;
    const height = 400;

    const render = Render.create({
        element: gameWidget,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio
        }
    });

    // Add particles overlay
    const particles = document.createElement('div');
    particles.className = 'particles-overlay';
    gameWidget.appendChild(particles);

    // --- Game Objects ---
    const wallOptions = { isStatic: true, render: { fillStyle: 'rgba(255,255,255,0.05)' } };
    const ground = Bodies.rectangle(width / 2, height + 50, width * 2, 100, wallOptions);
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, wallOptions);
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, wallOptions);
    const topWall = Bodies.rectangle(width / 2, -50, width * 2, 100, wallOptions);

    const goalWidth = 140;
    const goalY = height * 0.15;
    const postOptions = { isStatic: true, restitution: 0.9, render: { fillStyle: '#ffffff' } };
    
    const leftPost = Bodies.circle(width / 2 - goalWidth / 2, goalY, 5, postOptions);
    const rightPost = Bodies.circle(width / 2 + goalWidth / 2, goalY, 5, postOptions);
    
    const backNet = Bodies.rectangle(width / 2, goalY - 20, goalWidth, 10, {
        isStatic: true, restitution: 0.2, render: { fillStyle: 'rgba(255,255,255,0.2)' }
    });

    const goalSensor = Bodies.rectangle(width / 2, goalY - 10, goalWidth - 10, 20, {
        isStatic: true, isSensor: true, render: { visible: false }
    });

    const startX = width / 2;
    const startY = height * 0.8;
    
    let ball = Bodies.circle(startX, startY, 12, {
        restitution: 0.8,
        friction: 0.005,
        frictionAir: 0.02,
        density: 0.05,
        render: { fillStyle: '#ffffff', strokeStyle: '#000', lineWidth: 2 }
    });

    let sling = Constraint.create({
        pointA: { x: startX, y: startY },
        bodyB: ball,
        stiffness: 0.05,
        damping: 0.1,
        render: { visible: true, lineWidth: 2, strokeStyle: 'rgba(255, 255, 255, 0.3)' }
    });

    Composite.add(engine.world, [
        ground, leftWall, rightWall, topWall,
        leftPost, rightPost, backNet, goalSensor,
        ball, sling
    ]);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // --- Logic ---
    let isFired = false;
    let gameState = 'playing';

    Events.on(mouseConstraint, 'enddrag', function(e) {
        if (e.body === ball && !isFired) {
            const dist = Vector.magnitude(Vector.sub(ball.position, { x: startX, y: startY }));
            if (dist > 15) {
                isFired = true;
                sling.bodyB = null;
                sling.render.visible = false;
                sounds.kick.play();
            }
        }
    });

    function resetBall(message) {
        if (gameState === 'won') return;
        showMessage(message, 'miss');
        isFired = false;
        Matter.Body.setPosition(ball, { x: startX, y: startY });
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(ball, 0);
        sling.bodyB = ball;
        sling.render.visible = true;
    }

    Events.on(engine, 'afterUpdate', function() {
        if (isFired && gameState === 'playing') {
            const speed = Vector.magnitude(ball.velocity);
            if (speed < 0.1) {
                if (ball.position.y < startY - 50) {
                    resetBall("Almost there!");
                } else {
                    resetBall("More power!");
                }
            }
        }
    });

    Events.on(engine, 'collisionStart', function(event) {
        const pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA;
            const bodyB = pairs[i].bodyB;

            if ((bodyA === ball && bodyB === goalSensor) || (bodyB === ball && bodyA === goalSensor)) {
                if (gameState !== 'won') triggerWin();
            }
        }
    });

    function showMessage(text, type = 'success') {
        msgElement.textContent = text;
        msgElement.className = `show ${type}`;
        setTimeout(() => msgElement.className = '', 2000);
    }

    function triggerWin() {
        gameState = 'won';
        sounds.whistle.play();
        setTimeout(() => sounds.goal.play(), 300);
        showMessage("GOAL!", 'success');
        
        // Confetti originating from the widget
        const rect = gameWidget.getBoundingClientRect();
        const originX = (rect.left + rect.width / 2) / window.innerWidth;
        const originY = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: originX, y: originY },
            zIndex: 9999
        });

        setTimeout(unlockPortfolio, 1500);
    }

    function unlockPortfolio() {
        // Remove blur from rest of the site
        lockedSections.classList.remove('blur-locked');
        // Hide the title prompt in the game widget
        document.querySelector('.game-title').style.display = 'none';
        showMessage("Unlocked!", 'success');
    }
});
