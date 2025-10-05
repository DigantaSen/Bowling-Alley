// Physics Engine using Cannon.js
console.log('[PHYSICS] Loading physics-engine.js...');

class PhysicsEngine {
    constructor() {
        this.world = null;
        this.timeStep = 1 / 60;
        this.maxSubSteps = 3;
        this.bodies = [];
        this.lastTime = 0;
        this.init();
    }

    init() {
        // Create physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        
        // Set solver iterations for better accuracy
        this.world.solver.iterations = 20;
        
        // Add contact materials for realistic physics
        this.setupContactMaterials();
    }

    setupContactMaterials() {
        // Materials
        const pinMaterial = new CANNON.Material('pin');
        const ballMaterial = new CANNON.Material('ball');
        const laneMaterial = new CANNON.Material('lane');

        // Pin-Pin contact
        const pinPinContact = new CANNON.ContactMaterial(pinMaterial, pinMaterial, {
            friction: 0.3,
            restitution: 0.5
        });

        // Ball-Pin contact
        const ballPinContact = new CANNON.ContactMaterial(ballMaterial, pinMaterial, {
            friction: 0.3,
            restitution: 0.5
        });

        // Ball-Lane contact
        const ballLaneContact = new CANNON.ContactMaterial(ballMaterial, laneMaterial, {
            friction: 0.05,
            restitution: 0.3
        });

        // Pin-Lane contact
        const pinLaneContact = new CANNON.ContactMaterial(pinMaterial, laneMaterial, {
            friction: 0.4,
            restitution: 0.3
        });

        this.world.addContactMaterial(pinPinContact);
        this.world.addContactMaterial(ballPinContact);
        this.world.addContactMaterial(ballLaneContact);
        this.world.addContactMaterial(pinLaneContact);

        this.materials = {
            pin: pinMaterial,
            ball: ballMaterial,
            lane: laneMaterial
        };
    }

    createLane() {
        // Create bowling lane floor - shortened for better gameplay
        const laneShape = new CANNON.Box(new CANNON.Vec3(1, 0.1, 12));
        const laneBody = new CANNON.Body({
            mass: 0, // Static body
            material: this.materials.lane
        });
        laneBody.addShape(laneShape);
        laneBody.position.set(0, -0.1, 0);
        this.world.addBody(laneBody);

        // Create lane walls (gutters) - shortened
        const wallShape = new CANNON.Box(new CANNON.Vec3(0.1, 0.5, 12));
        
        const leftWall = new CANNON.Body({ mass: 0 });
        leftWall.addShape(wallShape);
        leftWall.position.set(-1.1, 0.5, 0);
        this.world.addBody(leftWall);

        const rightWall = new CANNON.Body({ mass: 0 });
        rightWall.addShape(wallShape);
        rightWall.position.set(1.1, 0.5, 0);
        this.world.addBody(rightWall);

        // No back wall - ball and pins fall into pit at the end (like real bowling)

        return {
            lane: laneBody,
            leftWall,
            rightWall
        };
    }

    createBall(position = { x: 0, y: 1, z: 9 }) {
        const radius = 0.11; // Bowling ball radius (approx 11cm)
        const ballShape = new CANNON.Sphere(radius);
        const ballBody = new CANNON.Body({
            mass: 6, // 6kg bowling ball
            material: this.materials.ball,
            linearDamping: 0.05,
            angularDamping: 0.1
        });
        ballBody.addShape(ballShape);
        ballBody.position.set(position.x, position.y, position.z);
        this.world.addBody(ballBody);
        this.bodies.push(ballBody);
        return ballBody;
    }

    createPin(position) {
        // Bowling pin shape (approximated as cylinder + sphere on top)
        const pinHeight = 0.38; // 38cm tall
        const pinRadius = 0.06; // 6cm radius at widest point
        
        // Create cylinder shape - cylinders in Cannon.js are along Y axis by default (vertical)
        const pinShape = new CANNON.Cylinder(pinRadius * 0.5, pinRadius, pinHeight, 8);
        const pinBody = new CANNON.Body({
            mass: 1.5, // 1.5kg pin
            material: this.materials.pin,
            linearDamping: 0.5,
            angularDamping: 0.5
        });
        
        // Add shape with quaternion to align with Three.js cylinder orientation
        const shapeQuaternion = new CANNON.Quaternion();
        shapeQuaternion.setFromEuler(Math.PI / 2, 0, 0); // Rotate shape to match Three.js
        pinBody.addShape(pinShape, new CANNON.Vec3(0, 0, 0), shapeQuaternion);
        
        pinBody.position.set(position.x, position.y, position.z);
        
        // Pin body orientation is already upright (no rotation needed on body itself)
        
        this.world.addBody(pinBody);
        this.bodies.push(pinBody);
        return pinBody;
    }

    throwBall(ballBody, direction, power) {
        // Apply force to throw the ball - increased from 50 to 80 for more satisfying throws
        const baseForce = 80;
        const force = new CANNON.Vec3(
            direction.x * power * baseForce,
            0,
            direction.z * power * baseForce
        );
        ballBody.applyImpulse(force, ballBody.position);

        // Add spin for realism - increased spin effect
        const spin = new CANNON.Vec3(0, direction.x * power * 3, -power * 5);
        ballBody.angularVelocity.copy(spin);
    }

    update(deltaTime) {
        // Use variable timestep with interpolation for smoother motion
        if (!deltaTime) deltaTime = this.timeStep;
        
        // Clamp deltaTime to prevent spiral of death
        const clampedDelta = Math.min(deltaTime, 0.1);
        
        // Step the physics world with fixed timestep and interpolation
        this.world.step(this.timeStep, clampedDelta, this.maxSubSteps);
    }

    removeBall(ballBody) {
        this.world.removeBody(ballBody);
        const index = this.bodies.indexOf(ballBody);
        if (index > -1) {
            this.bodies.splice(index, 1);
        }
    }

    removePin(pinBody) {
        this.world.removeBody(pinBody);
        const index = this.bodies.indexOf(pinBody);
        if (index > -1) {
            this.bodies.splice(index, 1);
        }
    }

    reset() {
        // Remove all dynamic bodies
        this.bodies.forEach(body => {
            this.world.removeBody(body);
        });
        this.bodies = [];
    }

    isPinKnockedDown(pinBody) {
        // Check if pin has tipped over
        // Since we fixed pins to stand upright (body quaternion at identity, shape rotated),
        // we need to check if the body itself has rotated significantly from upright
        
        const quaternion = pinBody.quaternion;
        const euler = new CANNON.Vec3();
        quaternion.toEuler(euler);
        
        // For an upright pin (standing), euler angles should be close to (0, 0, 0)
        // Check if pin is tilted more than 45 degrees from vertical on X or Z axis
        const tiltX = Math.abs(euler.x);
        const tiltZ = Math.abs(euler.z);
        const maxTilt = Math.PI / 4; // 45 degrees
        
        // Pin is knocked down if:
        // 1. Tilted more than 45 degrees on either axis, OR
        // 2. Fallen through the floor (y < 0.1)
        return tiltX > maxTilt || tiltZ > maxTilt || pinBody.position.y < 0.1;
    }

    isBallStopped(ballBody) {
        // Check if ball has stopped moving
        const velocity = ballBody.velocity.length();
        
        // Ball is considered stopped only when nearly motionless
        // Very strict threshold to ensure ball has completely stopped
        return velocity < 0.01;
    }

    isPinMoving(pinBody) {
        // Check if a pin is still moving significantly (tumbling or sliding)
        if (!pinBody) return false;
        
        const velocity = pinBody.velocity.length();
        const angularVelocity = pinBody.angularVelocity.length();
        
        // Pin considered moving only if moving significantly - higher thresholds for speed
        return velocity > 0.25 || angularVelocity > 0.8;
    }
}
