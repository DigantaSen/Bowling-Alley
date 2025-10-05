// Bowling Scoring System - Implements SOOK Rules
console.log('[SCORING] Loading scoring-system.js...');

class ScoringSystem {
    constructor() {
        this.games = [];
        this.currentGameIndex = 0;
        this.maxGames = 3;
        this.initNewGame();
    }

    initNewGame() {
        const game = {
            frames: [],
            totalScore: 0,
            isComplete: false
        };

        // Initialize 10 frames
        for (let i = 0; i < 10; i++) {
            game.frames.push({
                frameNumber: i + 1,
                throws: [],
                score: null,
                isStrike: false,
                isSpare: false,
                isComplete: false
            });
        }

        this.games.push(game);
        return game;
    }

    getCurrentGame() {
        return this.games[this.currentGameIndex];
    }

    getCurrentFrame() {
        const game = this.getCurrentGame();
        return game.frames.find(f => !f.isComplete) || game.frames[9];
    }

    recordThrow(pinsKnockedDown) {
        const game = this.getCurrentGame();
        const currentFrame = this.getCurrentFrame();
        
        if (!currentFrame || game.isComplete) {
            return false;
        }

        currentFrame.throws.push(pinsKnockedDown);

        // Handle 10th frame special rules
        if (currentFrame.frameNumber === 10) {
            this.handle10thFrame(currentFrame);
        } else {
            this.handleRegularFrame(currentFrame);
        }

        // Calculate scores after each throw
        this.calculateScores();

        return true;
    }

    handleRegularFrame(frame) {
        const totalPins = frame.throws.reduce((sum, pins) => sum + pins, 0);

        // First throw
        if (frame.throws.length === 1) {
            if (frame.throws[0] === 10) {
                // Strike
                frame.isStrike = true;
                frame.isComplete = true;
            }
        }
        // Second throw
        else if (frame.throws.length === 2) {
            if (totalPins === 10) {
                // Spare
                frame.isSpare = true;
            }
            frame.isComplete = true;
        }
    }

    handle10thFrame(frame) {
        const firstThrow = frame.throws[0] || 0;
        const secondThrow = frame.throws[1] || 0;
        const thirdThrow = frame.throws[2] || 0;

        // Strike on first throw: get 2 more balls
        if (firstThrow === 10) {
            frame.isStrike = true;
            if (frame.throws.length >= 3) {
                frame.isComplete = true;
            }
        }
        // Spare (first two balls = 10): get 1 more ball
        else if (firstThrow + secondThrow === 10) {
            frame.isSpare = true;
            if (frame.throws.length >= 3) {
                frame.isComplete = true;
            }
        }
        // Open frame: only 2 balls
        else if (frame.throws.length >= 2) {
            frame.isComplete = true;
        }
    }

    calculateScores() {
        const game = this.getCurrentGame();
        let cumulativeScore = 0;

        for (let i = 0; i < 10; i++) {
            const frame = game.frames[i];
            
            if (i < 9) {
                // Regular frames (1-9)
                if (frame.isStrike) {
                    // Strike: 10 + next 2 balls
                    const nextFrame = game.frames[i + 1];
                    if (nextFrame.throws.length >= 2) {
                        frame.score = 10 + nextFrame.throws[0] + nextFrame.throws[1];
                    } else if (nextFrame.throws.length === 1) {
                        // Next frame is also a strike
                        if (nextFrame.isStrike && i < 8) {
                            const frameAfterNext = game.frames[i + 2];
                            if (frameAfterNext.throws.length >= 1) {
                                frame.score = 10 + 10 + frameAfterNext.throws[0];
                            }
                        }
                    }
                } else if (frame.isSpare) {
                    // Spare: 10 + next 1 ball
                    const nextFrame = game.frames[i + 1];
                    if (nextFrame.throws.length >= 1) {
                        frame.score = 10 + nextFrame.throws[0];
                    }
                } else if (frame.isComplete) {
                    // Open frame: just sum of pins
                    frame.score = frame.throws.reduce((sum, pins) => sum + pins, 0);
                }
            } else {
                // 10th frame
                if (frame.isComplete) {
                    frame.score = frame.throws.reduce((sum, pins) => sum + pins, 0);
                }
            }

            // Calculate cumulative score
            if (frame.score !== null) {
                cumulativeScore += frame.score;
            }
        }

        game.totalScore = cumulativeScore;

        // Check if game is complete
        if (game.frames[9].isComplete) {
            game.isComplete = true;
        }
    }

    getFrameDisplay(frame) {
        if (frame.frameNumber === 10) {
            // 10th frame special display
            const displays = frame.throws.map((pins, idx) => {
                if (pins === 10) return 'X';
                if (idx > 0 && pins + frame.throws[idx - 1] === 10) return '/';
                return pins > 0 ? pins : '-';
            });
            while (displays.length < 3) displays.push('');
            return displays;
        }

        if (frame.isStrike) {
            return ['X', ''];
        }
        
        if (frame.isSpare) {
            return [frame.throws[0] || '-', '/'];
        }

        return [
            frame.throws[0] !== undefined ? (frame.throws[0] || '-') : '',
            frame.throws[1] !== undefined ? (frame.throws[1] || '-') : ''
        ];
    }

    getGameScore() {
        return this.getCurrentGame().totalScore;
    }

    get3GameAverage() {
        if (this.games.length === 0) return 0;
        const completedGames = this.games.filter(g => g.isComplete);
        if (completedGames.length === 0) return 0;
        
        const total = completedGames.reduce((sum, game) => sum + game.totalScore, 0);
        return Math.round(total / completedGames.length);
    }

    startNextGame() {
        if (this.currentGameIndex < this.maxGames - 1) {
            this.currentGameIndex++;
            this.initNewGame();
            return true;
        }
        return false;
    }

    reset() {
        this.games = [];
        this.currentGameIndex = 0;
        this.initNewGame();
    }

    isSeriesComplete() {
        return this.games.length >= this.maxGames && 
               this.games.every(g => g.isComplete);
    }

    getAllGamesData() {
        return this.games.map((game, idx) => ({
            gameNumber: idx + 1,
            frames: game.frames,
            totalScore: game.totalScore,
            isComplete: game.isComplete
        }));
    }
}

// Multi-player scoring for Unified modes
class MultiPlayerScoring {
    constructor(mode) {
        this.mode = mode; // 'singles', 'doubles', 'team'
        this.players = [];
        this.currentPlayerIndex = 0;
        this.initPlayers();
    }

    initPlayers() {
        const playerCounts = {
            'singles': 1,
            'doubles': 2,
            'team': 4
        };

        const count = playerCounts[this.mode] || 1;
        
        for (let i = 0; i < count; i++) {
            this.players.push({
                name: this.getPlayerName(i),
                scoringSystem: new ScoringSystem()
            });
        }
    }

    getPlayerName(index) {
        if (this.mode === 'singles') {
            return 'Player 1';
        } else if (this.mode === 'doubles') {
            return index === 0 ? 'Athlete' : 'Partner';
        } else {
            return index < 2 ? `Athlete ${index + 1}` : `Partner ${index - 1}`;
        }
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    recordThrow(pinsKnockedDown) {
        const player = this.getCurrentPlayer();
        const recorded = player.scoringSystem.recordThrow(pinsKnockedDown);
        
        // Check if current player's frame is complete
        if (recorded) {
            const currentFrame = player.scoringSystem.getCurrentFrame();
            if (currentFrame.isComplete) {
                this.moveToNextPlayer();
            }
        }
        
        return recorded;
    }

    moveToNextPlayer() {
        // Only move to next player after frame is complete
        const currentPlayer = this.getCurrentPlayer();
        const currentFrame = currentPlayer.scoringSystem.getCurrentFrame();
        
        if (currentFrame.isComplete) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        }
    }

    getCombinedScore() {
        return this.players.reduce((total, player) => {
            return total + player.scoringSystem.getGameScore();
        }, 0);
    }

    getCombined3GameAverage() {
        const total = this.players.reduce((sum, player) => {
            return sum + player.scoringSystem.get3GameAverage();
        }, 0);
        return Math.round(total);
    }

    getAllPlayersData() {
        return this.players.map(player => ({
            name: player.name,
            games: player.scoringSystem.getAllGamesData(),
            average: player.scoringSystem.get3GameAverage()
        }));
    }

    isGameComplete() {
        return this.players.every(player => 
            player.scoringSystem.getCurrentGame().isComplete
        );
    }

    startNextGame() {
        this.players.forEach(player => {
            player.scoringSystem.startNextGame();
        });
        this.currentPlayerIndex = 0;
    }

    reset() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.initPlayers();
    }
}
