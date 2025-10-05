// Main.js - Application entry point
console.log('[MAIN] Loading main.js...');

let scene, camera, renderer, controls;
let physicsEngine, gameObjects, multiPlayerScoring, gameController, uiManager;
let isMouseDown = false;
let throwPower = 0;
let mousePosition = { x: 0, y: 0 };
let aimDirection = { x: 0, z: -1 };
let clock = null;
let lastTime = 0;
let previewObjects = []; // Track preview objects for cleanup
let cameraControlsEnabled = false;

// Initialize the application
function init() {
    console.log('[MAIN] Init function called');
    
    // Check if libraries are loaded
    if (typeof THREE === 'undefined') {
        console.error('[MAIN] THREE.js not loaded yet, retrying...');
        document.getElementById('status-message').textContent = 'Loading THREE.js...';
        setTimeout(init, 100);
        return;
    }
    if (typeof CANNON === 'undefined') {
        console.error('[MAIN] CANNON not loaded yet, retrying...');
        document.getElementById('status-message').textContent = 'Loading CANNON.js...';
        setTimeout(init, 100);
        return;
    }
    
    console.log('[MAIN] Libraries loaded successfully!');
    document.getElementById('status-message').textContent = 'Initializing game...';
    
    try {
        console.log('[MAIN] Setting up scene...');
        // Setup Three.js scene
        setupScene();
        
        // Initialize clock for deltaTime
        clock = new THREE.Clock();
        
        console.log('[MAIN] Creating physics engine...');
        // Initialize game systems
        physicsEngine = new PhysicsEngine();
        
        console.log('[MAIN] Creating game objects...');
        gameObjects = new GameObjects(scene);
        
        console.log('[MAIN] Creating multiplayer scoring...');
        multiPlayerScoring = new MultiPlayerScoring('singles');
        
        console.log('[MAIN] Creating game controller...');
        gameController = new GameController(scene, camera, physicsEngine, gameObjects, multiPlayerScoring);
        
        console.log('[MAIN] Creating UI manager...');
        uiManager = new UIManager(gameController, multiPlayerScoring);
        
        // Set UI manager reference in game controller for callbacks
        gameController.uiManager = uiManager;
        
        console.log('[MAIN] Creating preview scene...');
        // Create initial preview scene (lane visible before game starts)
        createPreviewScene();
        
        console.log('[MAIN] Setting up controls...');
        // Setup controls
        setupControls();
        
        console.log('[MAIN] Starting animation loop...');
        // Start animation loop
        animate();
        
        // Show initial message
        uiManager.showStatus('Select game mode and click "Start Game" to begin!');
        
        console.log('[MAIN] Game initialized successfully!');
        
    } catch(error) {
        console.error('[MAIN] Initialization error:', error);
        console.error('[MAIN] Stack:', error.stack);
        document.getElementById('status-message').textContent = 'ERROR: ' + error.message;
    }
}

function createPreviewScene() {
    // Add a preview ball to show the scene is working
    const ballGeometry = new THREE.SphereGeometry(0.11, 32, 32); // Reduced from 64 for performance
    const ballMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x2196F3,
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 0.8
    });
    const previewBall = new THREE.Mesh(ballGeometry, ballMaterial);
    previewBall.position.set(0, 1, 9); // Moved closer
    previewBall.castShadow = true;
    previewBall.receiveShadow = true;
    scene.add(previewBall);
    previewObjects.push(previewBall); // Track for cleanup
    
    // Add a preview pin with better material
    const pinGeometry = new THREE.CylinderGeometry(0.03, 0.06, 0.38, 24);
    const pinMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0xFFFFFF,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2
    });
    const previewPin = new THREE.Mesh(pinGeometry, pinMaterial);
    previewPin.position.set(0, 0.19, -10); // Moved closer
    previewPin.castShadow = true;
    previewPin.receiveShadow = true;
    scene.add(previewPin);
    previewObjects.push(previewPin); // Track for cleanup
    
    // Add text/indicator that scene is ready
    console.log('Preview scene created - 3D rendering active!');
}

function removePreviewObjects() {
    // Remove all preview objects from the scene
    previewObjects.forEach(obj => {
        scene.remove(obj);
        // Dispose of geometries and materials to free memory
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    previewObjects = [];
    console.log('Preview objects removed');
}

function setupScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.FogExp2(0x0a0e27, 0.02);

    // Setup camera - adjusted for shorter lane
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 3, 11);
    camera.lookAt(0, 0, 0);

    // Setup renderer with enhanced settings
    const canvas = document.getElementById('bowling-canvas');
    const container = canvas.parentElement;
    
    // Get container dimensions
    const width = container.clientWidth || window.innerWidth * 0.6;
    const height = container.clientHeight || window.innerHeight;
    
    console.log('Canvas size:', width, 'x', height);
    
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimized for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // Faster than PCFSoft
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    
    // Update camera aspect ratio
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Add enhanced lighting
    addSceneLighting();
    
    // Setup OrbitControls for 3D camera movement
    setupOrbitControls();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function setupOrbitControls() {
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI / 2;
        controls.target.set(0, 0, 0);
        controls.enabled = false; // Disabled by default, toggle with 'C' key
        console.log('[MAIN] OrbitControls initialized - Press C to toggle camera mode');
    } else {
        console.warn('[MAIN] OrbitControls not available');
    }
}

function addSceneLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
    scene.add(ambientLight);

    // Main directional light (sun-like) - optimized shadow map
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024; // Reduced from 2048 for performance
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -15;
    mainLight.shadow.camera.right = 15;
    mainLight.shadow.camera.top = 15;
    mainLight.shadow.camera.bottom = -15;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0x8080ff, 0.4);
    fillLight.position.set(-5, 8, -5);
    scene.add(fillLight);

    // Spotlight on pin area - optimized
    const pinSpotlight = new THREE.SpotLight(0xffd700, 1.2);
    pinSpotlight.position.set(0, 8, -10);
    pinSpotlight.target.position.set(0, 0, -10);
    pinSpotlight.angle = Math.PI / 6;
    pinSpotlight.penumbra = 0.3;
    pinSpotlight.castShadow = false; // Disabled for performance
    scene.add(pinSpotlight);
    scene.add(pinSpotlight.target);

    // Hemisphere light for soft ambient color
    const hemiLight = new THREE.HemisphereLight(0x8080ff, 0x404040, 0.4);
    scene.add(hemiLight);
}

function setupControls() {
    const canvas = document.getElementById('bowling-canvas');
    
    // Mouse controls for aiming and power
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    
    // Touch controls for mobile
    canvas.addEventListener('touchstart', onTouchStart, false);
    canvas.addEventListener('touchmove', onTouchMove, false);
    canvas.addEventListener('touchend', onTouchEnd, false);
    
    // Keyboard controls
    document.addEventListener('keydown', onKeyDown, false);
}

function onMouseMove(event) {
    // Don't update game controls if camera mode is active
    if (cameraControlsEnabled) return;
    
    const canvas = document.getElementById('bowling-canvas');
    const rect = canvas.getBoundingClientRect();
    
    mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Only update aim if game is playing
    if (gameController && gameController.state && gameController.state.isPlaying) {
        // Update aim direction based on mouse X position - more sensitive (0.5 -> 0.7)
        aimDirection.x = mousePosition.x * 0.7;
        aimDirection.z = -1;
        
        // Visual feedback for aiming (optional - shows in console)
        if (isMouseDown && throwPower > 0 && throwPower < 1.0) {
            const aimAngle = Math.atan2(aimDirection.x, -aimDirection.z) * (180 / Math.PI);
            console.log(`[AIM] Angle: ${aimAngle.toFixed(1)}°, Power: ${(throwPower * 100).toFixed(0)}%`);
        }
    }
    
    // Update power while mouse is down
    if (isMouseDown) {
        updateThrowPower();
    }
}

function onMouseDown(event) {
    // Don't handle game controls if camera mode is active
    if (cameraControlsEnabled) return;
    
    // Check if game controller exists and is ready
    if (!gameController || !gameController.state) {
        console.log('[MAIN] Game not started yet');
        return;
    }
    
    const state = gameController.getGameState();
    
    if (!state.canThrow) {
        console.log('[MAIN] Cannot throw - ball in motion or waiting for reset');
        return;
    }
    
    isMouseDown = true;
    throwPower = 0;
    uiManager.showStatus('Hold to charge power... Release to throw!');
}

function onMouseUp(event) {
    if (!isMouseDown) return;
    
    isMouseDown = false;
    
    // Don't handle game controls if camera mode is active
    if (cameraControlsEnabled) {
        throwPower = 0;
        return;
    }
    
    // Check if game is ready
    if (!gameController || !gameController.state) {
        console.log('[MAIN] Game not ready');
        uiManager.updatePowerMeter(0);
        throwPower = 0;
        return;
    }
    
    const state = gameController.getGameState();
    if (!state.canThrow) {
        uiManager.updatePowerMeter(0);
        throwPower = 0;
        return;
    }
    
    // Minimum power threshold - even quick clicks get 30% power
    const actualPower = Math.max(0.3, throwPower);
    
    // Normalize aim direction before throwing
    const length = Math.sqrt(aimDirection.x * aimDirection.x + aimDirection.z * aimDirection.z);
    const normalizedAim = {
        x: aimDirection.x / length,
        z: aimDirection.z / length
    };
    
    // Throw the ball with normalized direction and actual power
    const success = gameController.throwBall(normalizedAim, actualPower);
    
    if (success) {
        const powerPercent = Math.round(actualPower * 100);
        uiManager.showStatus(`Ball thrown with ${powerPercent}% power! Watch the pins!`);
        uiManager.updatePowerMeter(0);
        throwPower = 0;
    } else {
        uiManager.showStatus('Cannot throw right now!');
        uiManager.updatePowerMeter(0);
        throwPower = 0;
    }
}
// Touch controls
function onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    onMouseDown(mouseEvent);
}

function onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    onMouseMove(mouseEvent);
}

function onTouchEnd(event) {
    event.preventDefault();
    onMouseUp(null);
}

function onKeyDown(event) {
    // C key - toggle camera controls mode
    if (event.key === 'c' || event.key === 'C') {
        if (controls) {
            cameraControlsEnabled = !cameraControlsEnabled;
            controls.enabled = cameraControlsEnabled;
            
            if (cameraControlsEnabled) {
                uiManager.showStatus('📷 3D Camera Mode: Use mouse to rotate/zoom camera. Press C to disable.');
                console.log('[MAIN] Camera controls ENABLED - Drag to rotate, scroll to zoom');
            } else {
                uiManager.showStatus('🎮 Game Mode: Mouse controls ball aim and power. Press C for 3D camera.');
                console.log('[MAIN] Camera controls DISABLED - Back to game controls');
            }
        }
    }
    
    // R key - reset camera
    if (event.key === 'r' || event.key === 'R') {
        camera.position.set(0, 3, 11); // Adjusted for shorter lane
        camera.lookAt(0, 0, 0);
        if (controls) {
            controls.target.set(0, 0, 0);
            controls.update();
        }
        uiManager.showStatus('📷 Camera reset to default position');
    }
    
    // Space - quick throw (for testing)
    if (event.key === ' ') {
        event.preventDefault();
        const state = gameController.getGameState();
        if (state.canThrow && !cameraControlsEnabled) {
            gameController.throwBall({ x: 0, z: -1 }, 0.7);
        }
    }
}

function updateThrowPower() {
    // Faster, smoother power increase - reaches max in ~1 second instead of 1.7s
    // Increment by 0.02 per frame (at 60 FPS = ~50 frames to max)
    throwPower = Math.min(1.0, throwPower + 0.02);
    uiManager.updatePowerMeter(throwPower);
}

function onWindowResize() {
    const canvas = document.getElementById('bowling-canvas');
    const container = canvas.parentElement;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Calculate deltaTime for smooth physics
    const deltaTime = clock ? clock.getDelta() : 1/60;
    
    // Update OrbitControls if enabled
    if (controls && cameraControlsEnabled) {
        controls.update();
    }
    
    // ALWAYS render the scene, even before game starts
    // This ensures preview scene is visible
    if (gameController) {
        // Update game controller with deltaTime (only updates if playing)
        gameController.update(deltaTime);
        
        // Update UI based on game state
        const state = gameController.getGameState();
        
        // Check if throw is complete
        if (gameController.state.waitingForReset) {
            // Wait for frame reset
        }
        
        // Camera follows ball when in motion with smooth interpolation (only if orbit controls disabled)
        if (!cameraControlsEnabled && gameController.state.ballInMotion && gameController.ballBody) {
            const ballPos = gameController.ballBody.position;
            const targetX = ballPos.x * 0.3;
            const targetZ = Math.max(11, ballPos.z + 4); // Adjusted for shorter lane
            
            // Smooth camera interpolation
            camera.position.x += (targetX - camera.position.x) * 0.1;
            camera.position.z += (targetZ - camera.position.z) * 0.1;
            camera.lookAt(ballPos.x, 0, ballPos.z);
        }
    }
    
    // ALWAYS render - this is critical for visibility
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.gameController = gameController;
window.uiManager = uiManager;
window.scene = scene;
window.removePreviewObjects = removePreviewObjects;
