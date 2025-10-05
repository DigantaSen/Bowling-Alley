// Game Controller - Main game logic
console.log('[CONTROLLER] Loading game-controller.js...');

class GameController {
    constructor(scene, camera, physicsEngine, gameObjects, multiPlayerScoring) {
        this.scene = scene;
        this.camera = camera;
        this.physics = physicsEngine;
        this.gameObjects = gameObjects;
        this.scoring = multiPlayerScoring;
        this.uiManager = null; // Will be set by UIManager
        
        this.state = {
            isPlaying: false,
            isThrowing: false,
            ballInMotion: false,
            waitingForReset: false,
            currentBall: 1,
            pinsRemaining: 10
        };

        this.ballBody = null;
        this.pinBodies = [];
        this.knockedPins = [];
        
        this.throwStartTime = 0;
        this.ballStoppedTime = 0; // Track when ball actually stops
        this.settleTime = 800; // Short wait after ball stops for final pin movements
        this.isResetting = false; // Prevent multiple simultaneous resets
    }

    startGame() {
        this.state.isPlaying = true;
        // Remove preview objects from the scene
        if (window.removePreviewObjects) {
            window.removePreviewObjects();
        }
        this.resetFrame();
    }

    resetFrame() {
        // Clear previous objects
        this.gameObjects.removeBall();
        this.gameObjects.removePins();
        this.physics.reset();

        // Recreate physics lane
        this.physics.createLane();

        // Create new pins
        const pinMeshes = this.gameObjects.createPins();
        this.pinBodies = [];
        
        pinMeshes.forEach((pinMesh, index) => {
            const position = pinMesh.position;
            const pinBody = this.physics.createPin(position);
            this.pinBodies.push(pinBody);
        });

        // Reset knocked pins tracking
        this.knockedPins = [];
        this.state.pinsRemaining = 10;
        this.state.ballInMotion = false;
        this.state.waitingForReset = false;
        this.isResetting = false;
        this.state.currentBall = 1; // Reset to first ball for new frame

        // Create ball
        this.resetBall();
        
        // Update UI
        if (this.uiManager) {
            this.uiManager.updateGameInfo();
            this.uiManager.updateScorecard();
            this.uiManager.showStatus('New frame ready - aim and throw!');
        }
    }

    resetBall() {
        this.gameObjects.removeBall();
        const ballMesh = this.gameObjects.createBall();
        const startPosition = { x: 0, y: 1, z: 9 }; // Closer start position
        ballMesh.position.set(startPosition.x, startPosition.y, startPosition.z);
        this.ballBody = this.physics.createBall(startPosition);
        this.state.isThrowing = false;
    }

    throwBall(direction, power) {
        // Validate state before throwing
        if (this.state.isThrowing || this.state.ballInMotion || this.state.waitingForReset || this.isResetting) {
            console.log('[CONTROLLER] Cannot throw - ball in motion or resetting');
            return false;
        }
        
        if (!this.ballBody) {
            console.error('[CONTROLLER] Cannot throw - no ball body');
            return false;
        }

        this.state.isThrowing = true;
        this.state.ballInMotion = true;
        this.throwStartTime = Date.now();
        this.ballStoppedTime = 0; // Reset stopped timer for new throw

        // Normalize direction
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        const normalizedDirection = {
            x: direction.x / length,
            z: direction.z / length
        };

        this.physics.throwBall(this.ballBody, normalizedDirection, power);
        
        return true;
    }

    update(deltaTime) {
        if (!this.state.isPlaying) return;

        // Update physics with deltaTime for smooth motion
        this.physics.update(deltaTime);

        // Update visual representations
        if (this.ballBody) {
            this.gameObjects.updateBallPosition(this.ballBody);
        }
        
        // Update pins safely
        if (this.gameObjects.objects.pins && this.pinBodies) {
            const pinCount = Math.min(this.gameObjects.objects.pins.length, this.pinBodies.length);
            for (let i = 0; i < pinCount; i++) {
                if (this.gameObjects.objects.pins[i] && this.pinBodies[i]) {
                    this.gameObjects.updatePinPosition(this.gameObjects.objects.pins[i], this.pinBodies[i]);
                }
            }
        }

        // Check for knocked down pins
        if (this.state.ballInMotion && !this.isResetting) {
            this.checkKnockedPins();
            
            const timeSinceThrow = Date.now() - this.throwStartTime;
            
            // Check if ball has exited the pitch (fell into pit, gutter, or past boundaries)
            const ballExited = this.ballBody && (
                this.ballBody.position.z < -11 ||     // Past the pins (into back pit)
                this.ballBody.position.y < -1 ||       // Fell below lane level
                Math.abs(this.ballBody.position.x) > 1.5 || // Into the gutters (left/right)
                this.ballBody.position.z > 12          // Rolled backwards off the approach
            );
            
            if (ballExited) {
                console.log('[CONTROLLER] Ball exited pitch at position:', {
                    x: this.ballBody.position.x.toFixed(2),
                    y: this.ballBody.position.y.toFixed(2),
                    z: this.ballBody.position.z.toFixed(2)
                });
                
                if (!this.state.waitingForReset) {
                    // Stop the ball's physics immediately
                    this.ballBody.velocity.set(0, 0, 0);
                    this.ballBody.angularVelocity.set(0, 0, 0);
                    
                    // Hide the ball visually (it exited the pitch)
                    if (this.gameObjects.objects.ball) {
                        this.gameObjects.objects.ball.visible = false;
                    }
                    
                    // Remove ball from physics world to stop all motion
                    if (this.ballBody) {
                        this.physics.world.removeBody(this.ballBody);
                        this.ballBody = null;
                    }
                    
                    // Mark ball as no longer in motion (it's gone)
                    this.state.ballInMotion = false;
                    
                    // Wait a moment for pins to settle, then score
                    // DON'T set waitingForReset yet - handleThrowComplete will do that
                    setTimeout(() => {
                        this.handleThrowComplete();
                    }, 800);
                }
                return;
            }
            
            // Check if ball has stopped (on the lane or elsewhere)
            if (this.ballBody && this.physics.isBallStopped(this.ballBody)) {
                // Record when ball first stopped
                if (this.ballStoppedTime === 0) {
                    this.ballStoppedTime = Date.now();
                    console.log('[CONTROLLER] Ball stopped at position:', {
                        x: this.ballBody.position.x.toFixed(2),
                        y: this.ballBody.position.y.toFixed(2),
                        z: this.ballBody.position.z.toFixed(2)
                    }, 'Waiting for pins to settle...');
                }
                
                // Wait for settle time AFTER ball stops
                const timeSinceStopped = Date.now() - this.ballStoppedTime;
                if (timeSinceStopped > this.settleTime && !this.state.waitingForReset) {
                    // Additional check: Make sure most pins have also settled
                    const pinsStillMoving = this.checkPinsStillMoving();
                    if (!pinsStillMoving) {
                        console.log('[CONTROLLER] Ball stopped and pins settled, completing throw...');
                        this.handleThrowComplete();
                    } else {
                        // Pins still moving, wait a bit more
                        console.log('[CONTROLLER] Ball stopped but pins still settling...');
                    }
                }
            } else {
                // Ball is still moving, reset stopped timer
                if (this.ballStoppedTime !== 0) {
                    // Log when ball starts moving again (useful for debugging bounces)
                    console.log('[CONTROLLER] Ball started moving again');
                }
                this.ballStoppedTime = 0;
            }
            
            // No timeout - game waits indefinitely for ball to stop or exit pitch
            // Ball must either:
            // 1. Exit the pitch boundaries (back, sides, down, or front)
            // 2. Come to a complete stop (velocity + angular velocity checks)
        }
    }

    checkKnockedPins() {
        if (!this.pinBodies || this.pinBodies.length === 0) {
            return;
        }
        
        this.pinBodies.forEach((pinBody, index) => {
            if (pinBody && !this.knockedPins.includes(index) && this.physics.isPinKnockedDown(pinBody)) {
                this.knockedPins.push(index);
            }
        });
    }

    checkPinsStillMoving() {
        // Check if any pins are still moving significantly
        if (!this.pinBodies || this.pinBodies.length === 0) {
            return false;
        }
        
        let movingPins = 0;
        this.pinBodies.forEach((pinBody) => {
            if (pinBody && this.physics.isPinMoving(pinBody)) {
                movingPins++;
            }
        });
        
        // If more than 1 pin is still moving significantly, wait longer
        // This prevents premature scoring while allowing faster gameplay
        return movingPins > 1;
    }

    handleThrowComplete() {
        // Prevent multiple calls
        if (this.isResetting || this.state.waitingForReset) {
            return;
        }
        
        this.state.ballInMotion = false;
        this.state.waitingForReset = true;
        this.isResetting = true;

        const pinsKnockedDown = this.knockedPins.length;
        
        // Get current frame and ball number BEFORE recording throw
        const currentPlayer = this.scoring.getCurrentPlayer();
        const frameBeforeThrow = currentPlayer.scoringSystem.getCurrentFrame();
        const frameNumberBeforeThrow = frameBeforeThrow.frameNumber;
        const currentBallBeforeThrow = this.state.currentBall;
        
        // Record the throw - this will mark frame as complete if applicable
        this.scoring.recordThrow(pinsKnockedDown);

        // Re-get the frame to see its updated state
        const game = currentPlayer.scoringSystem.getCurrentGame();
        const frameJustThrown = game.frames[frameNumberBeforeThrow - 1];
        
        // Show feedback message
        if (this.uiManager) {
            let message = `${pinsKnockedDown} pins knocked down! `;
            if (pinsKnockedDown === 10 && currentBallBeforeThrow === 1) {
                message += '🎳 STRIKE!';
            } else if (frameJustThrown.isSpare) {
                message += '⚡ SPARE!';
            }
            this.uiManager.showStatus(message);
        }
        
        // Determine next action based on the frame we just threw in
        if (frameJustThrown.frameNumber < 10) {
            // Regular frames (1-9)
            if (frameJustThrown.isStrike || frameJustThrown.isComplete) {
                // Reset all pins for next frame
                this.state.currentBall = 1;
                setTimeout(() => this.resetFrame(), 1500);
            } else {
                // Second ball - remove knocked pins, keep standing ones
                this.state.currentBall = 2;
                setTimeout(() => this.resetForSecondBall(), 1500);
            }
        } else {
            // 10th frame special handling
            this.handle10thFrameReset(frameJustThrown);
        }

        // Update UI AFTER updating ball number
        if (this.uiManager) {
            this.uiManager.updateScorecard();
            this.uiManager.updateGameInfo();
        }

        // Highlight knocked pins
        this.gameObjects.highlightKnockedPins(this.knockedPins);

        return {
            pinsKnockedDown,
            isFrameComplete: frameJustThrown.isComplete,
            isStrike: frameJustThrown.isStrike,
            isSpare: frameJustThrown.isSpare
        };
    }

    resetForSecondBall() {
        // Remove knocked pins in reverse order to avoid index issues
        const pinsToRemove = [...this.knockedPins].sort((a, b) => b - a);
        
        pinsToRemove.forEach(index => {
            if (this.gameObjects.objects.pins[index]) {
                this.scene.remove(this.gameObjects.objects.pins[index]);
                this.gameObjects.objects.pins.splice(index, 1);
            }
            if (this.pinBodies[index]) {
                this.physics.removePin(this.pinBodies[index]);
                this.pinBodies.splice(index, 1);
            }
        });

        this.knockedPins = [];
        this.state.pinsRemaining = this.pinBodies.length;
        
        // Reset ball
        this.resetBall();
        this.gameObjects.clearHighlights();
        
        // Clear reset flags
        this.state.waitingForReset = false;
        this.isResetting = false;
        
        // Update UI
        if (this.uiManager) {
            this.uiManager.updateGameInfo();
            this.uiManager.showStatus('Second ball - knock down remaining pins!');
        }
    }

    handle10thFrameReset(frame) {
        const throwCount = frame.throws.length;

        if (frame.isComplete) {
            // Frame complete, move to next
            this.state.currentBall = 1;
            setTimeout(() => {
                if (this.scoring.isGameComplete()) {
                    this.handleGameComplete();
                } else {
                    this.resetFrame();
                }
            }, 1500);
        } else {
            // Need more throws
            if (throwCount === 1 && frame.throws[0] === 10) {
                // Strike on first ball - reset all pins
                this.state.currentBall = 2;
                setTimeout(() => this.resetFrame(), 1500);
            } else if (throwCount === 2) {
                const total = frame.throws[0] + frame.throws[1];
                if (total === 10) {
                    // Spare - reset all pins for bonus ball
                    this.state.currentBall = 3;
                    setTimeout(() => this.resetFrame(), 1500);
                } else if (frame.throws[0] === 10) {
                    // Strike on first, need third ball
                    this.state.currentBall = 3;
                    setTimeout(() => this.resetForSecondBall(), 1500);
                }
            }
        }
    }

    handleGameComplete() {
        const canStartNext = this.scoring.getCurrentPlayer().scoringSystem.startNextGame();
        
        if (canStartNext) {
            // Start next game
            setTimeout(() => this.resetFrame(), 2000);
        } else {
            // All 3 games complete
            this.state.isPlaying = false;
        }
    }

    getGameState() {
        const currentPlayer = this.scoring.getCurrentPlayer();
        const currentFrame = currentPlayer.scoringSystem.getCurrentFrame();
        const currentGame = currentPlayer.scoringSystem.getCurrentGame();

        return {
            playerName: currentPlayer.name,
            gameNumber: currentPlayer.scoringSystem.currentGameIndex + 1,
            frameNumber: currentFrame.frameNumber,
            ballNumber: this.state.currentBall,
            pinsRemaining: this.state.pinsRemaining,
            currentScore: currentPlayer.scoringSystem.getGameScore(),
            isGameComplete: currentGame.isComplete,
            canThrow: !this.state.ballInMotion && !this.state.waitingForReset,
            combinedScore: this.scoring.getCombinedScore(),
            combinedAverage: this.scoring.getCombined3GameAverage()
        };
    }

    reset() {
        this.state.isPlaying = false;
        this.state.ballInMotion = false;
        this.state.waitingForReset = false;
        this.state.currentBall = 1;
        this.gameObjects.removeBall();
        this.gameObjects.removePins();
        this.physics.reset();
    }
}
