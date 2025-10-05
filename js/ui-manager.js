// UI Manager - Handles all UI updates and interactions
console.log('[UI] Loading ui-manager.js...');

class UIManager {
    constructor(gameController, multiPlayerScoring) {
        this.gameController = gameController;
        this.scoring = multiPlayerScoring;
        
        this.elements = {
            currentPlayer: document.getElementById('current-player'),
            currentGame: document.getElementById('current-game'),
            currentFrame: document.getElementById('current-frame'),
            currentBall: document.getElementById('current-ball'),
            powerFill: document.getElementById('power-fill'),
            powerValue: document.getElementById('power-value'),
            statusMessage: document.getElementById('status-message'),
            scorecardContainer: document.getElementById('scorecard-container'),
            summaryContent: document.getElementById('summary-content'),
            modeSelect: document.getElementById('mode-select'),
            startGameBtn: document.getElementById('start-game-btn'),
            toggleRulesBtn: document.getElementById('toggle-rules-btn'),
            rulesModal: document.getElementById('rules-modal')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Rules modal
        this.elements.toggleRulesBtn.addEventListener('click', () => {
            this.elements.rulesModal.style.display = 'block';
        });

        const closeBtn = this.elements.rulesModal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            this.elements.rulesModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.elements.rulesModal) {
                this.elements.rulesModal.style.display = 'none';
            }
        });

        // Start game button
        this.elements.startGameBtn.addEventListener('click', () => {
            const mode = this.elements.modeSelect.value;
            this.startNewGame(mode);
        });
    }

    startNewGame(mode) {
        // Reset scoring
        this.scoring.mode = mode;
        this.scoring.reset();
        
        // Reset game controller
        this.gameController.scoring = this.scoring;
        this.gameController.startGame();
        
        this.updateScorecard();
        this.updateGameInfo();
        this.showStatus('🎮 Game started! Use mouse to aim & throw. Press C for 3D camera view!');
        
        // Show a helpful tip after 3 seconds
        setTimeout(() => {
            this.showStatus('💡 Tip: Press C to explore the bowling alley in 3D camera mode!');
        }, 3000);
    }

    updateGameInfo() {
        const state = this.gameController.getGameState();
        
        this.elements.currentPlayer.textContent = state.playerName;
        this.elements.currentGame.textContent = `${state.gameNumber} of 3`;
        this.elements.currentFrame.textContent = state.frameNumber;
        this.elements.currentBall.textContent = state.ballNumber;
    }

    updatePowerMeter(power) {
        const percentage = Math.min(100, Math.max(0, power * 100));
        this.elements.powerFill.style.width = `${percentage}%`;
        this.elements.powerValue.textContent = `${Math.round(percentage)}%`;
    }

    showStatus(message) {
        this.elements.statusMessage.textContent = message;
    }

    updateScorecard() {
        this.elements.scorecardContainer.innerHTML = '';
        
        const playersData = this.scoring.getAllPlayersData();
        
        playersData.forEach(playerData => {
            const scorecardDiv = this.createPlayerScorecard(playerData);
            this.elements.scorecardContainer.appendChild(scorecardDiv);
        });

        this.updateSummary();
    }

    createPlayerScorecard(playerData) {
        const scorecardDiv = document.createElement('div');
        scorecardDiv.className = 'scorecard';

        const header = document.createElement('div');
        header.className = 'scorecard-header';
        header.textContent = playerData.name;
        scorecardDiv.appendChild(header);

        playerData.games.forEach((gameData, gameIndex) => {
            const gameTable = document.createElement('table');
            gameTable.className = 'scorecard-table';

            // Header row
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = '<th>Frame</th>';
            for (let i = 1; i <= 10; i++) {
                headerRow.innerHTML += `<th>${i}</th>`;
            }
            headerRow.innerHTML += '<th>Total</th>';
            gameTable.appendChild(headerRow);

            // Throws row
            const throwsRow = document.createElement('tr');
            throwsRow.innerHTML = '<td><strong>Throws</strong></td>';
            
            gameData.frames.forEach(frame => {
                const throwsCell = document.createElement('td');
                throwsCell.className = 'frame-cell';
                
                const throwsDiv = document.createElement('div');
                throwsDiv.className = frame.frameNumber === 10 ? 
                    'frame-throws tenth-frame' : 'frame-throws';
                
                const displays = this.getFrameDisplays(frame);
                displays.forEach(display => {
                    const throwBox = document.createElement('div');
                    throwBox.className = 'throw-box';
                    if (display === 'X') throwBox.classList.add('strike');
                    if (display === '/') throwBox.classList.add('spare');
                    throwBox.textContent = display;
                    throwsDiv.appendChild(throwBox);
                });
                
                throwsCell.appendChild(throwsDiv);
                throwsRow.appendChild(throwsCell);
            });

            throwsRow.innerHTML += '<td>-</td>';
            gameTable.appendChild(throwsRow);

            // Score row
            const scoreRow = document.createElement('tr');
            scoreRow.innerHTML = '<td><strong>Score</strong></td>';
            
            let cumulativeScore = 0;
            gameData.frames.forEach(frame => {
                const scoreCell = document.createElement('td');
                scoreCell.className = 'frame-score';
                
                if (frame.score !== null) {
                    cumulativeScore += frame.score;
                    scoreCell.textContent = cumulativeScore;
                } else {
                    scoreCell.textContent = '-';
                }
                
                scoreRow.appendChild(scoreCell);
            });

            const totalCell = document.createElement('td');
            totalCell.className = 'frame-score';
            totalCell.style.fontWeight = 'bold';
            totalCell.style.fontSize = '18px';
            totalCell.textContent = gameData.totalScore || 0;
            scoreRow.appendChild(totalCell);
            
            gameTable.appendChild(scoreRow);

            // Game label
            const gameLabel = document.createElement('div');
            gameLabel.style.textAlign = 'center';
            gameLabel.style.padding = '5px';
            gameLabel.style.background = '#f0f0f0';
            gameLabel.style.fontWeight = 'bold';
            gameLabel.textContent = `Game ${gameIndex + 1}`;
            
            scorecardDiv.appendChild(gameLabel);
            scorecardDiv.appendChild(gameTable);
        });

        return scorecardDiv;
    }

    getFrameDisplays(frame) {
        const scoringSystem = new ScoringSystem();
        return scoringSystem.getFrameDisplay(frame);
    }

    updateSummary() {
        this.elements.summaryContent.innerHTML = '';

        const playersData = this.scoring.getAllPlayersData();
        
        playersData.forEach(playerData => {
            const playerDiv = document.createElement('div');
            playerDiv.style.marginBottom = '15px';
            
            const nameDiv = document.createElement('div');
            nameDiv.style.fontWeight = 'bold';
            nameDiv.style.marginBottom = '8px';
            nameDiv.textContent = playerData.name;
            playerDiv.appendChild(nameDiv);

            playerData.games.forEach((game, idx) => {
                if (game.isComplete) {
                    const gameRow = document.createElement('div');
                    gameRow.className = 'summary-row';
                    gameRow.innerHTML = `
                        <span>Game ${idx + 1}:</span>
                        <span>${game.totalScore}</span>
                    `;
                    playerDiv.appendChild(gameRow);
                }
            });

            const avgRow = document.createElement('div');
            avgRow.className = 'summary-row';
            avgRow.innerHTML = `
                <span>Average:</span>
                <span>${playerData.average}</span>
            `;
            playerDiv.appendChild(avgRow);

            this.elements.summaryContent.appendChild(playerDiv);
        });

        // Combined score for multi-player modes
        if (this.scoring.mode !== 'singles') {
            const combinedDiv = document.createElement('div');
            combinedDiv.style.marginTop = '20px';
            combinedDiv.style.paddingTop = '15px';
            combinedDiv.style.borderTop = '2px solid #667eea';

            const combinedRow = document.createElement('div');
            combinedRow.className = 'summary-row total';
            combinedRow.innerHTML = `
                <span>Combined Average:</span>
                <span>${this.scoring.getCombined3GameAverage()}</span>
            `;
            combinedDiv.appendChild(combinedRow);

            const maxScore = this.scoring.mode === 'doubles' ? 600 : 1200;
            const maxDiv = document.createElement('div');
            maxDiv.style.textAlign = 'center';
            maxDiv.style.marginTop = '10px';
            maxDiv.style.fontSize = '12px';
            maxDiv.style.color = '#666';
            maxDiv.textContent = `Maximum possible: ${maxScore}`;
            combinedDiv.appendChild(maxDiv);

            this.elements.summaryContent.appendChild(combinedDiv);
        } else {
            const maxDiv = document.createElement('div');
            maxDiv.style.textAlign = 'center';
            maxDiv.style.marginTop = '10px';
            maxDiv.style.fontSize = '12px';
            maxDiv.style.color = '#666';
            maxDiv.textContent = 'Maximum possible: 300';
            this.elements.summaryContent.appendChild(maxDiv);
        }
    }

    showThrowResult(result) {
        let message = '';
        
        if (result.isStrike) {
            message = `🎯 STRIKE! ${result.pinsKnockedDown} pins!`;
        } else if (result.isSpare) {
            message = `✨ SPARE! ${result.pinsKnockedDown} pins!`;
        } else if (result.pinsKnockedDown === 0) {
            message = `Miss! Try again!`;
        } else {
            message = `${result.pinsKnockedDown} pins knocked down!`;
        }

        this.showStatus(message);
        
        // Update scorecard and game info
        setTimeout(() => {
            this.updateScorecard();
            this.updateGameInfo();
            
            if (result.isFrameComplete) {
                this.showStatus('Frame complete! Get ready for the next frame.');
            } else {
                this.showStatus('Second ball - knock down the remaining pins!');
            }
        }, 1500);
    }

    showGameComplete() {
        const state = this.gameController.getGameState();
        
        if (state.gameNumber >= 3) {
            const avg = this.scoring.getCombined3GameAverage();
            this.showStatus(`🎉 Series Complete! 3-Game Average: ${avg}`);
        } else {
            this.showStatus(`Game ${state.gameNumber} complete! Starting Game ${state.gameNumber + 1}...`);
        }
    }
}
