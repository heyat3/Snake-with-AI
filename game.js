class Snake {
    constructor(color, isAI = false) {
        this.body = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
        this.direction = {x: 1, y: 0};
        this.color = color;
        this.isAI = isAI;
    }

    move(food) {
        let newHead;
        if (this.isAI) {
            // AI snake follows food
            const head = this.body[0];
            const dx = food.x - head.x;
            const dy = food.y - head.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = {x: dx > 0 ? 1 : -1, y: 0};
            } else {
                this.direction = {x: 0, y: dy > 0 ? 1 : -1};
            }
        }
        
        newHead = {
            x: this.body[0].x + this.direction.x,
            y: this.body[0].y + this.direction.y
        };
        
        this.body.unshift(newHead);
    }

    grow() {
        // Keep the last segment when growing
        this.body.push({...this.body[this.body.length - 1]});
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.gridSize = 20;
        this.snake = null;
        this.aiSnake = null;
        this.food = null;
        this.score = 0;
        this.gameSpeed = 5;
        this.isGameOver = true;
        this.isPaused = false;
        this.isPlaying = false;
        this.hardMode = false;
        this.currentColor = '#00aa00';

        this.setupControls();
        this.setupEventListeners();
        this.drawEmptyBoard();
    }

    drawEmptyBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = '#ddd';
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupControls() {
        // Color picker
        const colorPicker = document.getElementById('snakeColor');
        colorPicker.value = this.currentColor;
        colorPicker.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            if (this.snake) {
                this.snake.color = this.currentColor;
                this.draw();
            }
        });

        // Speed slider
        const speedSlider = document.getElementById('gameSpeed');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            this.gameSpeed = parseInt(e.target.value);
            speedValue.textContent = e.target.value;
        });

        // Hard mode toggle
        document.getElementById('hardMode').addEventListener('change', (e) => {
            this.hardMode = e.target.checked;
            if (this.isPlaying) {
                this.startGame(); // Restart with new mode
            }
        });

        // Mobile controls
        const addControlHandler = (id, dx, dy) => {
            const button = document.getElementById(id);
            const handleInput = (e) => {
                e.preventDefault();
                if (this.isPlaying && !this.isPaused && !this.isGameOver) {
                    this.handleDirection(dx, dy);
                }
            };
            button.addEventListener('touchstart', handleInput);
            button.addEventListener('mousedown', handleInput);
        };

        addControlHandler('upButton', 0, -1);
        addControlHandler('downButton', 0, 1);
        addControlHandler('leftButton', -1, 0);
        addControlHandler('rightButton', 1, 0);
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && !this.isPaused && !this.isGameOver) {
                switch(e.key) {
                    case 'ArrowUp': this.handleDirection(0, -1); break;
                    case 'ArrowDown': this.handleDirection(0, 1); break;
                    case 'ArrowLeft': this.handleDirection(-1, 0); break;
                    case 'ArrowRight': this.handleDirection(1, 0); break;
                }
            }
            if (e.key === ' ') {
                e.preventDefault();
                this.togglePause();
            }
        });

        // Play/Pause button
        const pauseButton = document.getElementById('pauseButton');
        pauseButton.addEventListener('click', () => {
            if (!this.isPlaying || this.isGameOver) {
                this.startGame();
            } else {
                this.togglePause();
            }
        });
    }

    handleDirection(x, y) {
        if (this.snake) {
            // Prevent 180-degree turns
            if (this.snake.direction.x !== -x || this.snake.direction.y !== -y) {
                this.snake.direction = {x, y};
            }
        }
    }

    spawnFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
            };
        } while (this.isCollisionWithSnake(newFood));
        this.food = newFood;
    }

    isCollisionWithSnake(position) {
        return this.snake.body.some(segment => 
            segment.x === position.x && segment.y === position.y
        );
    }

    checkCollision(head) {
        // Wall collision
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }

        // Self collision
        if (this.snake.body.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        )) {
            return true;
        }

        // AI snake collision
        if (this.hardMode && this.aiSnake) {
            if (this.aiSnake.body.some(segment =>
                segment.x === head.x && segment.y === head.y
            )) {
                return true;
            }
        }

        return false;
    }

    startGame() {
        this.isPlaying = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        document.getElementById('scoreValue').textContent = '0';
        
        // Initialize snake
        this.snake = new Snake(this.currentColor);
        if (this.hardMode) {
            this.aiSnake = new Snake('#ff0000', true);
        } else {
            this.aiSnake = null;
        }
        
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('pauseButton').textContent = 'Pause';
        
        this.spawnFood();
        this.update();
    }

    togglePause() {
        if (!this.isPlaying || this.isGameOver) {
            this.startGame();
            return;
        }

        this.isPaused = !this.isPaused;
        const pauseButton = document.getElementById('pauseButton');
        pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (!this.isPaused) {
            this.update();
        }
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;
        this.isPaused = false;
        
        const pauseButton = document.getElementById('pauseButton');
        pauseButton.textContent = 'Play Again';
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        document.getElementById('finalScore').textContent = this.score;
        gameOverScreen.style.display = 'flex';
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = '#ddd';
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.snake) {
            this.snake.body.forEach(segment => {
                this.ctx.fillStyle = this.snake.color;
                this.ctx.fillRect(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize - 1,
                    this.gridSize - 1
                );
            });
        }

        if (this.hardMode && this.aiSnake) {
            this.aiSnake.body.forEach(segment => {
                this.ctx.fillStyle = this.aiSnake.color;
                this.ctx.fillRect(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize - 1,
                    this.gridSize - 1
                );
            });
        }

        if (this.food) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(
                this.food.x * this.gridSize,
                this.food.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        }
    }

    update() {
        if (this.isGameOver || this.isPaused || !this.isPlaying) return;

        this.snake.move(this.food);
        if (this.hardMode && this.aiSnake) {
            this.aiSnake.move(this.food);
        }

        // Check collisions
        const head = this.snake.body[0];
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.snake.grow();
            this.score += 10;
            document.getElementById('scoreValue').textContent = this.score;
            this.spawnFood();
        } else {
            this.snake.body.pop();
        }

        // AI Snake logic
        if (this.hardMode && this.aiSnake) {
            const aiHead = this.aiSnake.body[0];
            
            if (aiHead.x === this.food.x && aiHead.y === this.food.y) {
                this.aiSnake.grow();
                this.spawnFood();
            } else {
                this.aiSnake.body.pop();
            }

            // We've moved this check to the checkCollision method
        }

        this.draw();
        setTimeout(() => requestAnimationFrame(() => this.update()), 1000 / (this.gameSpeed * 2));
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
};