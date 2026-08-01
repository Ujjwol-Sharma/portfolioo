document.addEventListener('DOMContentLoaded', () => {
    
    const cells = document.querySelectorAll('.cell');
    const msgElement = document.getElementById('game-message');
    const retryBtn = document.getElementById('retry-btn');
    const lockedSections = document.getElementById('locked-sections');
    
    // Audio (reusing previous)
    const sounds = {
        pop: new Howl({ src: ['https://actions.google.com/sounds/v1/foley/glass_clink.ogg'], volume: 0.5 }),
        goal: new Howl({ src: ['https://actions.google.com/sounds/v1/crowds/crowd_cheer_large.ogg'], volume: 0.7 }),
        fail: new Howl({ src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'], volume: 0.4 })
    };

    let board = ['', '', '', '', '', '', '', '', ''];
    let human = 'X';
    let bot = 'O';
    let currentPlayer = human;
    let gameActive = true;
    let gameCount = 1; // 1 = Unbeatable, 2 = Easy, 3 = Unbeatable...

    const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    cells.forEach(cell => cell.addEventListener('click', onCellClick));
    retryBtn.addEventListener('click', resetGame);

    function onCellClick(e) {
        const index = e.target.getAttribute('data-index');
        
        if (board[index] !== '' || !gameActive || currentPlayer !== human) return;
        
        makeMove(index, human);
        sounds.pop.play();

        if (checkWin(board, human)) {
            endGame(human);
            return;
        }
        if (checkDraw(board)) {
            endGame('draw');
            return;
        }

        currentPlayer = bot;
        setTimeout(botMove, 500); // Small delay for realism
    }

    function makeMove(index, player) {
        board[index] = player;
        cells[index].textContent = player;
        cells[index].classList.add(player.toLowerCase());
        cells[index].classList.add('taken');
    }

    function botMove() {
        if (!gameActive) return;

        let move;
        if (gameCount % 2 !== 0) {
            // Unbeatable Mode (Minimax)
            move = minimax(board, bot).index;
        } else {
            // Easy Mode (Pick first empty cell, avoiding center if possible to play badly)
            move = getEasyMove(board);
        }

        makeMove(move, bot);
        sounds.pop.play();

        if (checkWin(board, bot)) {
            endGame(bot);
            return;
        }
        if (checkDraw(board)) {
            endGame('draw');
            return;
        }

        currentPlayer = human;
    }

    // --- Win Logic ---
    function checkWin(currentBoard, player) {
        for (let i = 0; i < winCombos.length; i++) {
            const [a, b, c] = winCombos[i];
            if (currentBoard[a] === player && currentBoard[b] === player && currentBoard[c] === player) {
                return true;
            }
        }
        return false;
    }

    function checkDraw(currentBoard) {
        return currentBoard.every(cell => cell !== '');
    }

    function getEmptyCells(currentBoard) {
        return currentBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    }

    // --- AI Logic ---
    function minimax(newBoard, player) {
        const availSpots = getEmptyCells(newBoard);

        if (checkWin(newBoard, human)) return { score: -10 };
        else if (checkWin(newBoard, bot)) return { score: 10 };
        else if (availSpots.length === 0) return { score: 0 };

        const moves = [];
        for (let i = 0; i < availSpots.length; i++) {
            const move = {};
            move.index = availSpots[i];
            newBoard[availSpots[i]] = player;

            if (player === bot) {
                const result = minimax(newBoard, human);
                move.score = result.score;
            } else {
                const result = minimax(newBoard, bot);
                move.score = result.score;
            }

            newBoard[availSpots[i]] = ''; // Reset spot
            moves.push(move);
        }

        let bestMove;
        if (player === bot) {
            let bestScore = -10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = 10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }

        return moves[bestMove];
    }

    function getEasyMove(currentBoard) {
        const availSpots = getEmptyCells(currentBoard);
        // Play badly: just pick the first available spot.
        // If they pick index 0, they aren't even trying to win or block.
        return availSpots[0];
    }

    // --- Game End Logic ---
    function endGame(winner) {
        gameActive = false;
        retryBtn.classList.remove('hidden');

        if (winner === human) {
            showMessage("You win! Unlocking portfolio...", 'success');
            sounds.goal.play();
            triggerConfetti();
            unlockPortfolio();
        } else if (winner === bot) {
            showMessage("Bot wins! Nice try.", 'fail');
            sounds.fail.play();
        } else {
            showMessage("It's a Draw! But I'm still undefeated.", 'fail');
            sounds.fail.play();
        }
    }

    function resetGame() {
        gameCount++;
        board = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        currentPlayer = human;
        
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell'; // Resets taken, x, o
        });
        
        retryBtn.classList.add('hidden');

        if (gameCount % 2 !== 0) {
            showMessage(`Game ${gameCount}: Unbeatable Mode`, '');
        } else {
            showMessage(`Game ${gameCount}: I'll go easy on you...`, '');
        }
    }

    function showMessage(text, type) {
        msgElement.textContent = text;
        msgElement.className = type;
    }

    function unlockPortfolio() {
        lockedSections.classList.remove('blur-locked');
    }

    function triggerConfetti() {
        const rect = document.getElementById('game-widget').getBoundingClientRect();
        const originX = (rect.left + rect.width / 2) / window.innerWidth;
        const originY = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: originX, y: originY },
            zIndex: 9999
        });
    }

});
