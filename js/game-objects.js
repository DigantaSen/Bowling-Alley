// Game Objects using Three.js
console.log('[OBJECTS] Loading game-objects.js...');

class GameObjects {
    constructor(scene) {
        this.scene = scene;
        this.objects = {
            lane: null,
            ball: null,
            pins: [],
            lights: []
        };
        this.createLane();
        this.createLights();
    }

    createLane() {
        // Lane floor - with beautiful wood texture simulation
        const laneGeometry = new THREE.BoxGeometry(2, 0.2, 24);
        const laneMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xAA6C39,
            roughness: 0.25,
            metalness: 0.05,
            clearcoat: 0.6,
            clearcoatRoughness: 0.1,
            reflectivity: 0.5
        });
        const lane = new THREE.Mesh(laneGeometry, laneMaterial);
        lane.position.set(0, -0.1, 0);
        lane.receiveShadow = true;
        lane.castShadow = false;
        this.scene.add(lane);

        // Add lane markings with glow
        const lineGeometry = new THREE.BoxGeometry(0.05, 0.21, 24);
        const lineMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.2,
            roughness: 0.1
        });
        
        const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
        leftLine.position.set(-0.95, 0, 0);
        this.scene.add(leftLine);

        const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
        rightLine.position.set(0.95, 0, 0);
        this.scene.add(rightLine);

        // Foul line with glow effect
        const foulLineGeometry = new THREE.BoxGeometry(2, 0.21, 0.05);
        const foulLineMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0xFF2244,
            emissive: 0xFF0000,
            emissiveIntensity: 0.5,
            roughness: 0.2
        });
        const foulLine = new THREE.Mesh(foulLineGeometry, foulLineMaterial);
        foulLine.position.set(0, 0, 10);
        this.scene.add(foulLine);

        // Approach area with better material
        const approachGeometry = new THREE.BoxGeometry(2, 0.19, 4);
        const approachMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xC17A3A,
            roughness: 0.4,
            metalness: 0.05,
            clearcoat: 0.3
        });
        const approach = new THREE.Mesh(approachGeometry, approachMaterial);
        approach.position.set(0, -0.09, 12);
        approach.receiveShadow = true;
        this.scene.add(approach);

        // Gutters with dark metallic look
        const gutterGeometry = new THREE.BoxGeometry(0.2, 0.3, 24);
        const gutterMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.3,
            metalness: 0.8
        });
        
        const leftGutter = new THREE.Mesh(gutterGeometry, gutterMaterial);
        leftGutter.position.set(-1.1, 0.15, 0);
        leftGutter.receiveShadow = true;
        this.scene.add(leftGutter);

        const rightGutter = new THREE.Mesh(gutterGeometry, gutterMaterial);
        rightGutter.position.set(1.1, 0.15, 0);
        rightGutter.receiveShadow = true;
        this.scene.add(rightGutter);

        // Pin deck with light wood
        const pinDeckGeometry = new THREE.BoxGeometry(1.5, 0.21, 2);
        const pinDeckMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xF5DEB3,
            roughness: 0.3,
            metalness: 0.02,
            clearcoat: 0.5
        });
        const pinDeck = new THREE.Mesh(pinDeckGeometry, pinDeckMaterial);
        pinDeck.position.set(0, 0, -10);
        pinDeck.receiveShadow = true;
        this.scene.add(pinDeck);

        this.objects.lane = lane;
    }

    createLights() {
        // Lights are now created in main.js for better control
        // Keep this method for compatibility but lights array will be empty
        this.objects.lights = [];
    }

    createBall() {
        const ballGeometry = new THREE.SphereGeometry(0.11, 32, 32); // Optimized polygon count
        const ballMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x1E88E5,
            roughness: 0.15,
            metalness: 0.9,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            reflectivity: 0.8
        });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.castShadow = true;
        ball.receiveShadow = true;
        this.scene.add(ball);
        this.objects.ball = ball;
        return ball;
    }

    createPins() {
        const pins = [];
        
        // Pin geometry - optimized polygon count
        const pinGeometry = new THREE.CylinderGeometry(0.03, 0.06, 0.38, 16); // Reduced from 24
        const pinMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xFFFFFF,
            roughness: 0.15,
            metalness: 0.05,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            reflectivity: 0.6
        });

        // Vibrant red stripes material
        const stripeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xFF1744,
            roughness: 0.2,
            metalness: 0.1
        });

        // Pin positions in triangular formation
        const pinPositions = this.calculatePinPositions();

        pinPositions.forEach((pos, index) => {
            const pin = new THREE.Group();
            
            // Main body
            const body = new THREE.Mesh(pinGeometry, pinMaterial);
            pin.add(body);

            // Red stripes
            const stripeGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.05, 16); // Reduced from 24
            const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe1.position.y = 0.1;
            pin.add(stripe1);

            const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe2.position.y = -0.05;
            pin.add(stripe2);

            pin.position.set(pos.x, pos.y, pos.z);
            pin.castShadow = true;
            pin.receiveShadow = true;
            pin.userData.pinNumber = index + 1;
            
            this.scene.add(pin);
            pins.push(pin);
        });

        this.objects.pins = pins;
        return pins;
    }

    calculatePinPositions() {
        // Standard 10-pin bowling formation
        const spacing = 0.3; // 30cm between pin centers
        const baseZ = -10; // Updated for shorter lane
        const baseY = 0.19;

        return [
            // Row 1 (front)
            { x: 0, y: baseY, z: baseZ },
            
            // Row 2
            { x: -spacing / 2, y: baseY, z: baseZ - spacing * 0.866 },
            { x: spacing / 2, y: baseY, z: baseZ - spacing * 0.866 },
            
            // Row 3
            { x: -spacing, y: baseY, z: baseZ - spacing * 1.732 },
            { x: 0, y: baseY, z: baseZ - spacing * 1.732 },
            { x: spacing, y: baseY, z: baseZ - spacing * 1.732 },
            
            // Row 4
            { x: -spacing * 1.5, y: baseY, z: baseZ - spacing * 2.598 },
            { x: -spacing * 0.5, y: baseY, z: baseZ - spacing * 2.598 },
            { x: spacing * 0.5, y: baseY, z: baseZ - spacing * 2.598 },
            { x: spacing * 1.5, y: baseY, z: baseZ - spacing * 2.598 }
        ];
    }

    updateBallPosition(ballBody) {
        if (this.objects.ball && ballBody) {
            // Use interpolation for smoother visual updates
            this.objects.ball.position.set(
                ballBody.position.x,
                ballBody.position.y,
                ballBody.position.z
            );
            this.objects.ball.quaternion.set(
                ballBody.quaternion.x,
                ballBody.quaternion.y,
                ballBody.quaternion.z,
                ballBody.quaternion.w
            );
        }
    }

    updatePinPosition(pinMesh, pinBody) {
        if (pinMesh && pinBody) {
            // Use explicit set methods for better synchronization
            pinMesh.position.set(
                pinBody.position.x,
                pinBody.position.y,
                pinBody.position.z
            );
            pinMesh.quaternion.set(
                pinBody.quaternion.x,
                pinBody.quaternion.y,
                pinBody.quaternion.z,
                pinBody.quaternion.w
            );
        }
    }

    removeBall() {
        if (this.objects.ball) {
            this.scene.remove(this.objects.ball);
            this.objects.ball = null;
        }
    }

    removePins() {
        this.objects.pins.forEach(pin => {
            this.scene.remove(pin);
        });
        this.objects.pins = [];
    }

    resetBall(position = { x: 0, y: 1, z: 9 }) {
        this.removeBall();
        const ball = this.createBall();
        ball.position.set(position.x, position.y, position.z);
        return ball;
    }

    highlightKnockedPins(knockedIndices) {
        this.objects.pins.forEach((pin, index) => {
            if (knockedIndices.includes(index)) {
                pin.children.forEach(child => {
                    if (child instanceof THREE.Mesh) {
                        child.material.emissive = new THREE.Color(0x00ff00);
                        child.material.emissiveIntensity = 0.3;
                    }
                });
            }
        });
    }

    clearHighlights() {
        this.objects.pins.forEach(pin => {
            pin.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });
        });
    }
}
