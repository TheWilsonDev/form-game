import { lerp } from './utils'; // Assuming lerp is moved to a utils file

// Add Particle class for explosion effects
class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    life: number;
    maxLife: number;
    gravity: number;

    constructor(x: number, y: number, color: string, size: number = 3) {
        this.x = x;
        this.y = y;
        // Random velocity in all directions
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = size * (0.5 + Math.random() * 0.5); // Random size variation
        this.color = color;
        this.maxLife = 30 + Math.random() * 30; // Random lifespan (0.5-1 second at 60fps)
        this.life = this.maxLife;
        this.gravity = 0.07; // Light gravity effect
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity; // Apply gravity
        this.life--;
        
        // Slow down particles over time
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        
        // Calculate opacity based on remaining life
        const opacity = this.life / this.maxLife;
        ctx.globalAlpha = opacity;
        
        // Create gradient for more dramatic effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#ffffff'); // White center
        gradient.addColorStop(0.3, this.color); // Main color
        gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Transparent edge
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1; // Reset alpha
    }
}

// Add Explosion class to manage particle groups
class Explosion {
    x: number;
    y: number;
    particles: Particle[];
    duration: number;
    active: boolean;
    shockwaveRadius: number;
    shockwaveMaxRadius: number;
    
    constructor(x: number, y: number, size: number = 1) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.active = true;
        this.duration = 60; // 1 second at 60fps
        
        // Add shockwave effect
        this.shockwaveRadius = 5;
        this.shockwaveMaxRadius = 50 * size;
        
        // Create particles with different colors for fire effect
        const particleCount = 60 * size;
        const colors = ['#ff4500', '#ff6a00', '#ff8c00', '#ffaa00', '#ffcc00']; // Fire colors
        
        for (let i = 0; i < particleCount; i++) {
            // Add slight position variation
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Create particle with jittered position
            this.particles.push(new Particle(
                this.x + offsetX, 
                this.y + offsetY, 
                color,
                2 + Math.random() * 4 * size // Varied sizes based on explosion size
            ));
        }
        
        // Add some smoke particles
        const smokeCount = 20 * size;
        for (let i = 0; i < smokeCount; i++) {
            const offset = (Math.random() - 0.5) * 15;
            const gray = Math.floor(150 + Math.random() * 105);
            const color = `rgba(${gray},${gray},${gray},0.7)`;
            
            const smokeParticle = new Particle(this.x + offset, this.y + offset, color, 5 * size);
            smokeParticle.vx *= 0.5; // Slower movement
            smokeParticle.vy *= 0.5;
            smokeParticle.vy -= 1; // Drift upward
            smokeParticle.gravity = 0.03; // Less gravity
            smokeParticle.maxLife *= 1.5; // Longer lasting
            smokeParticle.life = smokeParticle.maxLife;
            
            this.particles.push(smokeParticle);
        }
    }
    
    update() {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            
            // Remove dead particles
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update shockwave
        if (this.shockwaveRadius < this.shockwaveMaxRadius) {
            this.shockwaveRadius += (this.shockwaveMaxRadius - this.shockwaveRadius) * 0.15;
        }
        
        // Update duration
        this.duration--;
        
        // Mark explosion as inactive when all particles are gone or duration expires
        if (this.particles.length === 0 || this.duration <= 0) {
            this.active = false;
        }
    }
    
    draw(ctx: CanvasRenderingContext2D) {
        // Draw shockwave
        if (this.shockwaveRadius < this.shockwaveMaxRadius * 0.95) {
            const shockwaveOpacity = 1 - (this.shockwaveRadius / this.shockwaveMaxRadius);
            
            ctx.globalAlpha = shockwaveOpacity * 0.5;
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner shockwave
            ctx.globalAlpha = shockwaveOpacity * 0.8;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shockwaveRadius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.globalAlpha = 1;
        }
        
        // Draw all particles
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
    }
}

// Modify the Bomb class to include explosion
class Bomb {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    gravity: number;
    active: boolean;
    timeToLive: number; // Time before the bomb explodes
    explosion: Explosion | null;
    isExploding: boolean;
    size: number; // Size multiplier for explosions
    
    constructor(x: number, y: number, direction: 'left' | 'right', strength: number = 8) {
        this.x = x;
        this.y = y;
        this.vx = direction === 'right' ? strength : -strength; // Initial velocity based on direction
        this.vy = -5; // Initial upward velocity
        this.radius = 8;
        this.color = "#000000";
        this.gravity = 0.3;
        this.active = true;
        this.timeToLive = 120; // 2 seconds at 60fps
        this.explosion = null;
        this.isExploding = false;
        this.size = 1; // Default size
    }
    
    explode() {
        // Create explosion at current bomb position
        this.explosion = new Explosion(this.x, this.y, this.size);
        this.isExploding = true;
        // Make the bomb appear invisible now but keep it active until explosion completes
        this.radius = 0;
    }
    
    update() {
        if (this.isExploding) {
            // Update explosion if it exists
            if (this.explosion) {
                this.explosion.update();
                // When explosion is done, mark bomb as inactive
                if (!this.explosion.active) {
                    this.active = false;
                }
            } else {
                this.active = false;
            }
            return;
        }
        
        // Normal bomb physics when not exploding
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        
        // Countdown timer
        this.timeToLive--;
        if (this.timeToLive <= 0) {
            this.explode();
        }
    }
    
    draw(ctx: CanvasRenderingContext2D) {
        if (this.isExploding) {
            // Draw explosion if it exists
            if (this.explosion) {
                this.explosion.draw(ctx);
            }
            return;
        }
        
        // Draw bomb body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw fuse
        ctx.strokeStyle = "#FF6600";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x, this.y - this.radius - 5);
        ctx.stroke();
        
        // Draw spark (blinking effect)
        if (this.timeToLive % 6 < 3) {
            ctx.fillStyle = "#FFFF00";
        } else {
            ctx.fillStyle = "#FF0000";
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.radius - 5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // As bomb gets closer to exploding, make it pulse
        if (this.timeToLive < 30) {
            const pulseScale = 1 + 0.2 * Math.sin(this.timeToLive * 0.6);
            const warningRadius = this.radius * pulseScale;
            
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, warningRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    // Check collision with ground blocks
    collideWithMap(groundMap: Map<string, GroundBlockData>, blockSize: number) {
        if (this.isExploding) return;
        
        // Calculate bomb bounds
        const bombLeft = this.x - this.radius;
        const bombRight = this.x + this.radius;
        const bombTop = this.y - this.radius;
        const bombBottom = this.y + this.radius;
        
        // Check ground collision (bottom)
        const checkMinGridX = Math.floor(bombLeft / blockSize);
        const checkMaxGridX = Math.floor(bombRight / blockSize);
        const checkGridY = Math.floor(bombBottom / blockSize);
        
        for (let gx = checkMinGridX; gx <= checkMaxGridX; gx++) {
            const blockKey = `${gx},${checkGridY}`;
            if (groundMap.has(blockKey)) {
                const blockTop = checkGridY * blockSize;
                const blockLeft = gx * blockSize;
                const blockRight = blockLeft + blockSize;

                // Check horizontal overlap with the block
                if (bombRight > blockLeft && bombLeft < blockRight) {
                    // Check if the bottom edge is now at or below the block's top edge
                    if (bombBottom >= blockTop) {
                        // Bounce with reduced velocity
                        this.y = blockTop - this.radius;
                        this.vy = -this.vy * 0.6; // Dampen bounce
                        this.vx *= 0.8; // Add friction
                        
                        // Stop very small bounces
                        if (Math.abs(this.vy) < 0.5) {
                            this.vy = 0;
                        }
                        return;
                    }
                }
            }
        }

        // Check wall collisions
        const checkMinGridY = Math.floor(bombTop / blockSize);
        const checkMaxGridY = Math.floor(bombBottom / blockSize);
        
        // Left wall
        const leftGridX = Math.floor(bombLeft / blockSize);
        for (let gy = checkMinGridY; gy <= checkMaxGridY; gy++) {
            const blockKey = `${leftGridX},${gy}`;
            if (groundMap.has(blockKey)) {
                const blockRight = (leftGridX + 1) * blockSize;
                if (bombLeft <= blockRight) {
                    this.x = blockRight + this.radius;
                    this.vx = -this.vx * 0.6; // Bounce off wall
                    return;
                }
            }
        }
        
        // Right wall
        const rightGridX = Math.floor(bombRight / blockSize);
        for (let gy = checkMinGridY; gy <= checkMaxGridY; gy++) {
            const blockKey = `${rightGridX},${gy}`;
            if (groundMap.has(blockKey)) {
                const blockLeft = rightGridX * blockSize;
                if (bombRight >= blockLeft) {
                    this.x = blockLeft - this.radius;
                    this.vx = -this.vx * 0.6; // Bounce off wall
                    return;
                }
            }
        }
    }
}

export class Player {
    x: number;
    y: number;
    baseWidth: number; // Original width
    baseHeight: number; // Original height
    vx: number; // Velocity x
    vy: number; // Velocity y

    // Current animated dimensions
    currentWidth: number;
    currentHeight: number;
    targetWidth: number;
    targetHeight: number;
    squashStretchFactor: number; // Max % change in height
    squashStretchLerpFactor: number;

    color: string;
    gravity: number;
    jumpStrength: number;
    moveSpeed: number;
    maxSpeed: number;
    friction: number; // Damping/deceleration factor

    isJumping: boolean;
    isOnGround: boolean;

    // Arm properties
    facingDirection: 'left' | 'right';
    armWidth: number;
    armHeight: number;
    armColorLight: string;
    armColorDark: string;
    armHorizontalOffset: number; // How far arms stick out horizontally when moving
    armRadius: number;
    handRadius: number;
    handDistanceFromShoulder: number;
    topArmAngle: number;
    bottomArmAngle: number;
    targetTopArmAngle: number;
    targetBottomArmAngle: number;
    armSwingAmplitude: number; // Max angle arms swing (radians) - Renamed from armSwingAngle
    armSwingFrequency: number; // How fast arms swing
    armSwingLerpFactor: number; // Smoothness for arm swing (Renamed from armLerpFactor)
    armRestLerpFactor: number;  // Smoothness for returning to rest (Faster)
    walkCycleTimer: number; // Timer for walk animation

    // Debug Shoulder State
    currentTopShoulderX: number;
    currentBottomShoulderX: number;
    shoulderLagLerpFactor: number;

    // Debug Hitbox State
    hitboxPaddingX: number;
    hitboxPaddingY: number;

    // Debug Foot Anchor State (Renamed from Hip)
    footAnchorHorizontalOffset: number;

    // Foot properties
    footRadius: number;
    currentLeftFootX: number;
    currentRightFootX: number;
    footLerpFactor: number;

    // Sticky Target Point State (Debug)
    fixedLeftFootTargetPointX: number | null;
    fixedRightFootTargetPointX: number | null;
    lastDirectionKeyPressed: number; // 0 = none, 1 = right, -1 = left
    // Add new properties for black points
    previousLeftFootX: number | null;
    previousRightFootX: number | null;
    // Add state for alternating foot steps
    isLeftFootStepping: boolean;

    // Eye properties
    eyeMidpointX: number; // Based on current eye positions
    eyeMidpointY: number; // Based on current eye positions
    targetLeftEyeX: number; // The ideal position for the left eye
    targetRightEyeX: number; // The ideal position for the right eye
    targetEyeY: number; // The ideal Y position for both eyes
    currentLeftEyeX: number; // The current lerped position
    currentRightEyeX: number; // The current lerped position
    currentEyeY: number; // The current lerped position
    eyeLerpFactor: number; // Smoothing factor for eye movement

    // Add Hip Anchor Properties
    targetHipAnchorX: number;
    targetHipAnchorY: number;
    currentHipAnchorX: number;
    currentHipAnchorY: number;
    hipLerpFactor: number;

    // Add bombs array to track bombs
    bombs: Bomb[];
    bombCooldown: number;
    isChargingBomb: boolean;    // Is the player currently holding the bomb key?
    bombChargeTime: number;     // How long the key has been held (frames)
    trajectoryPoints: {x: number, y: number}[]; // Points for drawing the preview

    // Constants for Bomb Charging
    private MAX_BOMB_CHARGE_TIME: number = 90; // 1.5 seconds at 60fps
    private MIN_BOMB_THROW_STRENGTH: number = 4;
    private MAX_BOMB_THROW_STRENGTH: number = 12;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.baseWidth = width; // Store original dimensions
        this.baseHeight = height;
        this.vx = 0;
        this.vy = 0;

        // Initialize animated dimensions
        this.currentWidth = this.baseWidth;
        this.currentHeight = this.baseHeight;
        this.targetWidth = this.baseWidth;
        this.targetHeight = this.baseHeight;
        this.squashStretchFactor = 0.15; // Max 15% change
        this.squashStretchLerpFactor = 0.2; // Smoothing for squash/stretch

        this.color = 'red';
        this.gravity = 0.5;
        this.jumpStrength = -12;
        this.moveSpeed = 0.8; // Acceleration
        this.maxSpeed = 7;
        this.friction = 0.9; // closer to 1 = less friction, closer to 0 = more friction

        this.isJumping = false;
        this.isOnGround = false;

        // Initialize arm properties
        this.facingDirection = 'right';
        this.armWidth = 10;
        this.armHeight = 30; // Keep for potential future use, but radius/length used now
        this.armColorLight = 'lightcoral';
        this.armColorDark = 'darkred';
        this.armHorizontalOffset = 15;
        this.armRadius = this.armWidth / 2;
        this.handRadius = 6; // Example hand size
        this.handDistanceFromShoulder = 12.5; // Distance from shoulder center to hand center (Decreased by 50%)
        this.armSwingAmplitude = Math.PI / 4; // Swing 45 degrees
        this.armSwingFrequency = 0.15; // Adjust for desired swing speed
        this.armSwingLerpFactor = 0.2; // Keep the previous value for swinging
        this.armRestLerpFactor = 0.35; // Faster return to rest (Adjust as needed)
        this.walkCycleTimer = 0;

        // Initialize Debug Shoulder State (Start at initial anchor positions)
        // Calculate initial anchor positions based on default facing direction ('right')
        const initialTopShoulderX = this.x + this.baseWidth / 2 - this.armHorizontalOffset;
        const initialBottomShoulderX = this.x + this.baseWidth / 2 + this.armHorizontalOffset;
        this.currentTopShoulderX = initialTopShoulderX;
        this.currentBottomShoulderX = initialBottomShoulderX;
        this.shoulderLagLerpFactor = 0.55; // Adjust for desired lag amount (Increased for tighter follow)

        // Initialize Debug Hitbox State for 1.2 (H) x 1 (W) ratio (based on base dimensions)
        this.hitboxPaddingX = 5; // Base horizontal padding
        // Calculate vertical padding for desired ratio (assuming base 50x50 player)
        // Total width = 50 + 2*5 = 60. Target height = 1.2 * 60 = 72.
        // Required total vertical padding = 72 - 50 = 22. Padding per side = 11.
        this.hitboxPaddingY = 11; // Calculated vertical padding

        // Initialize Debug Foot Anchor State
        this.footAnchorHorizontalOffset = 12; // Slightly less than shoulder offset (15)

        // Initialize Foot properties
        this.footRadius = 5;
        const initialFootAnchorLeftX = this.x + this.baseWidth / 2 - this.footAnchorHorizontalOffset;
        const initialFootAnchorRightX = this.x + this.baseWidth / 2 + this.footAnchorHorizontalOffset;
        this.currentLeftFootX = initialFootAnchorLeftX;
        this.currentRightFootX = initialFootAnchorRightX;
        this.footLerpFactor = 0.4; // Increased for faster foot movement

        // Initialize Sticky Target Point State
        this.fixedLeftFootTargetPointX = null;
        this.fixedRightFootTargetPointX = null;
        this.lastDirectionKeyPressed = 0;
        // Initialize previous foot positions
        this.previousLeftFootX = null;
        this.previousRightFootX = null;
        // Initialize stepping state (left foot starts)
        this.isLeftFootStepping = true;

        // Initialize angles (pointing down)
        const initialAngle = Math.PI / 2;
        this.topArmAngle = initialAngle;
        this.bottomArmAngle = initialAngle;
        this.targetTopArmAngle = initialAngle;
        this.targetBottomArmAngle = initialAngle;

        // Initialize eye properties (based on base dimensions)
        this.targetEyeY = this.y + this.baseHeight / 4;
        if (this.facingDirection === 'right') {
            this.targetLeftEyeX = this.x + this.baseWidth / 3;
            this.targetRightEyeX = this.x + this.baseWidth * 2 / 3;
        } else {
            this.targetLeftEyeX = this.x + this.baseWidth * 2 / 3;
            this.targetRightEyeX = this.x + this.baseWidth / 3;
        }
        // Start current positions at target positions
        this.currentLeftEyeX = this.targetLeftEyeX;
        this.currentRightEyeX = this.targetRightEyeX;
        this.currentEyeY = this.targetEyeY;
        this.eyeMidpointX = (this.currentLeftEyeX + this.currentRightEyeX) / 2;
        this.eyeMidpointY = this.currentEyeY;
        this.eyeLerpFactor = 0.55; // Adjust for desired smoothness

        // Initialize Hip Anchor Properties
        this.targetHipAnchorX = this.x + this.baseWidth / 2;
        this.targetHipAnchorY = this.y + this.baseHeight / 2;
        this.currentHipAnchorX = this.x + this.baseWidth / 2;
        this.currentHipAnchorY = this.y + this.baseHeight / 2;
        this.hipLerpFactor = 0.55;

        // Initialize bombs array and cooldown
        this.bombs = [];
        this.bombCooldown = 0;
        this.isChargingBomb = false;    // Is the player currently holding the bomb key?
        this.bombChargeTime = 0;     // How long the key has been held (frames)
        this.trajectoryPoints = []; // Points for drawing the preview
    }

    applyGravity() {
        if (!this.isOnGround) {
            this.vy += this.gravity;
        }
    }

    // NEW Collision Detection System
    collideWithMap(groundMap: Map<string, GroundBlockData>, blockSize: number) {
        this.isOnGround = false; // Reset ground state each frame

        // Get current hitbox bounds (use calculated bounds based on potentially updated x/y)
        let hbLeft = this.x - this.hitboxPaddingX;
        let hbRight = this.x + this.baseWidth + this.hitboxPaddingX;
        let hbTop = this.y - this.hitboxPaddingY;
        let hbBottom = this.y + this.baseHeight + this.hitboxPaddingY;

        // Determine the grid cell range the hitbox might overlap
        const minGx = Math.floor(hbLeft / blockSize);
        const maxGx = Math.floor(hbRight / blockSize);
        const minGy = Math.floor(hbTop / blockSize);
        const maxGy = Math.floor(hbBottom / blockSize);

        // Iterate through potentially colliding grid cells
        for (let gy = minGy; gy <= maxGy; gy++) {
            for (let gx = minGx; gx <= maxGx; gx++) {
                const blockKey = `${gx},${gy}`;
                
                // Check if a solid block exists at this grid coordinate
                if (groundMap.has(blockKey)) {
                    const blockLeft = gx * blockSize;
                    const blockRight = blockLeft + blockSize;
                    const blockTop = gy * blockSize;
                    const blockBottom = blockTop + blockSize;

                    // --- AABB Collision Check ---
                    if (hbLeft < blockRight && hbRight > blockLeft && hbTop < blockBottom && hbBottom > blockTop) {
                        // Collision detected!
                        
                        // --- Calculate Penetration Depth ---
                        const overlapX = Math.min(hbRight - blockLeft, blockRight - hbLeft);
                        const overlapY = Math.min(hbBottom - blockTop, blockBottom - hbTop);
                        
                        // --- Resolve Collision based on Minimum Penetration ---
                        if (overlapY < overlapX) {
                            // Resolve Vertically
                            if (this.vy >= 0 && hbBottom > blockTop && hbTop < blockTop) { // Moving down / landing
                                this.y = blockTop - this.baseHeight - this.hitboxPaddingY; // Align bottom with block top
                                this.vy = 0;
                                this.isOnGround = true;
                                this.isJumping = false; // Can jump again
                            } else if (this.vy < 0 && hbTop < blockBottom && hbBottom > blockBottom) { // Moving up / hitting ceiling
                                this.y = blockBottom + this.hitboxPaddingY; // Align top with block bottom
                                this.vy = 0;
                            }
                        } else {
                            // Resolve Horizontally
                            if (this.vx > 0 && hbRight > blockLeft && hbLeft < blockLeft) { // Moving right
                                this.x = blockLeft - this.baseWidth - this.hitboxPaddingX; // Align right with block left
                                this.vx = 0;
                            } else if (this.vx < 0 && hbLeft < blockRight && hbRight > blockRight) { // Moving left
                                this.x = blockRight + this.hitboxPaddingX; // Align left with block right
                                this.vx = 0;
                            }
                        }
                        
                        // --- Important: Re-calculate hitbox bounds after resolution ---
                        // This handles cases where resolving one collision might cause another
                        hbLeft = this.x - this.hitboxPaddingX;
                        hbRight = this.x + this.baseWidth + this.hitboxPaddingX;
                        hbTop = this.y - this.hitboxPaddingY;
                        hbBottom = this.y + this.baseHeight + this.hitboxPaddingY;
                    }
                }
            }
        }
    }

    // Modify handleInput to accept specific keys
    handleInput(keys: { [key: string]: boolean }, keyConfig: { left: string, right: string, jump: string, bomb?: string }) {
        // Horizontal Movement
        if (keys[keyConfig.left]) {
            this.vx -= this.moveSpeed;
            this.facingDirection = 'left';
        } else if (keys[keyConfig.right]) {
            this.vx += this.moveSpeed;
            this.facingDirection = 'right';
        } else {
            // Apply friction only when no horizontal input
            this.vx *= this.friction;
        }

        // Clamp horizontal speed
        this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));

        // Stop movement if velocity is very small
        if (Math.abs(this.vx) < 0.1) {
            this.vx = 0;
        }

        // Jumping
        if (keys[keyConfig.jump] && this.isOnGround && !this.isJumping) {
            this.vy = this.jumpStrength;
            this.isJumping = true;
            this.isOnGround = false; // Set explicitly when jumping
        }

        // --- Bomb Charging & Throwing ---
        const bombKey = keyConfig.bomb;
        if (bombKey) {
            if (keys[bombKey] && this.bombCooldown <= 0 && !this.isChargingBomb) {
                // Start charging when key is pressed (and not already charging/on cooldown)
                this.isChargingBomb = true;
                this.bombChargeTime = 0;
            } else if (keys[bombKey] && this.isChargingBomb) {
                // Increment charge time while key is held
                this.bombChargeTime = Math.min(this.bombChargeTime + 1, this.MAX_BOMB_CHARGE_TIME);
                // Calculate trajectory preview while charging
                this.calculateTrajectory(); 
            } else if (!keys[bombKey] && this.isChargingBomb) {
                // Throw the bomb when key is released
                this.throwBomb(); 
                this.isChargingBomb = false;
                this.bombChargeTime = 0;
                this.trajectoryPoints = []; // Clear trajectory
            } else if (!this.isChargingBomb) {
                // Ensure trajectory is cleared if not charging
                this.trajectoryPoints = [];
            }
        } else if (!this.isChargingBomb) {
           // Ensure trajectory is cleared if no bomb key configured or not charging
           this.trajectoryPoints = [];
        }

        // Decrease bomb cooldown (only if not currently charging)
        if (this.bombCooldown > 0 && !this.isChargingBomb) {
            this.bombCooldown--;
        }
    }

    // Modify update signature to accept groundMap and blockSize
    update(keys: { [key: string]: boolean }, groundMap: Map<string, GroundBlockData>, blockSize: number, keyConfig: { left: string, right: string, jump: string, bomb?: string }) {
        this.handleInput(keys, keyConfig);
        this.applyGravity();

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        this.collideWithMap(groundMap, blockSize); // Use new collision method

        // Update bombs
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            bomb.update();
            bomb.collideWithMap(groundMap, blockSize);
            
            // Remove inactive bombs
            if (!bomb.active) {
                this.bombs.splice(i, 1);
            }
        }

        // --- Calculate Target Shoulder Anchor Positions (based on base width) --- 
        let targetTopShoulderX, targetBottomShoulderX;
        if (this.facingDirection === 'right') {
            targetTopShoulderX = this.x + this.baseWidth / 2 - this.armHorizontalOffset;
            targetBottomShoulderX = this.x + this.baseWidth / 2 + this.armHorizontalOffset;
        } else { // facingDirection === 'left'
            targetTopShoulderX = this.x + this.baseWidth / 2 + this.armHorizontalOffset;
            targetBottomShoulderX = this.x + this.baseWidth / 2 - this.armHorizontalOffset;
        }

        // --- Update Arm Angles --- 
        const restAngle = Math.PI / 2; // Angle pointing down
        const isMovingHorizontally = Math.abs(this.vx) > 0.1;
        let armSwing = 0;

        if (isMovingHorizontally) {
            this.walkCycleTimer += 1; // Increment timer
            armSwing = Math.sin(this.walkCycleTimer * this.armSwingFrequency) * this.armSwingAmplitude;
            this.targetTopArmAngle = restAngle + armSwing;
            this.targetBottomArmAngle = restAngle - armSwing;
        } else {
            this.walkCycleTimer = 0; // Reset timer when stopped
            this.targetTopArmAngle = restAngle;
            this.targetBottomArmAngle = restAngle;
        }

        // Smoothly update arm angles
        const currentAngleLerpFactor = isMovingHorizontally ? this.armSwingLerpFactor : this.armRestLerpFactor;
        this.topArmAngle = lerp(this.topArmAngle, this.targetTopArmAngle, currentAngleLerpFactor);
        this.bottomArmAngle = lerp(this.bottomArmAngle, this.targetBottomArmAngle, currentAngleLerpFactor);

        // --- Update Debug Shoulder Position --- 
        this.currentTopShoulderX = lerp(this.currentTopShoulderX, targetTopShoulderX, this.shoulderLagLerpFactor);
        this.currentBottomShoulderX = lerp(this.currentBottomShoulderX, targetBottomShoulderX, this.shoulderLagLerpFactor);

        // --- Update Sticky Target Points (based on base width) --- 
        const isPressingMoveKey = keys[keyConfig.left] || keys[keyConfig.right];
        const currentKeyDirection = keys[keyConfig.right] ? 1 : (keys[keyConfig.left] ? -1 : 0);
        const isActuallyMoving = Math.abs(this.vx) > 0.1; // Check if player has significant velocity
        const actualMoveDirection = isActuallyMoving ? Math.sign(this.vx) : 0;

        // --- State Change Detection based on Keys AND Actual Movement --- 
        // Started moving in the direction of the pressed key
        const startedMovingWithKey = isPressingMoveKey && actualMoveDirection === currentKeyDirection && this.lastDirectionKeyPressed === 0;
        // Switched key AND started moving in the new key direction
        const switchedKeyAndMoving = isPressingMoveKey && 
                                   this.lastDirectionKeyPressed !== 0 && 
                                   currentKeyDirection !== this.lastDirectionKeyPressed && 
                                   actualMoveDirection === currentKeyDirection;
        // Stopped pressing keys OR stopped moving despite pressing a key
        const stoppedEffectiveMovement = (!isPressingMoveKey || !isActuallyMoving) && this.lastDirectionKeyPressed !== 0;

        let recalculateTargets = false;

        if (startedMovingWithKey || switchedKeyAndMoving) {
            recalculateTargets = true;
        } else if (isPressingMoveKey && isActuallyMoving && this.fixedLeftFootTargetPointX !== null && this.fixedRightFootTargetPointX !== null) {
            // Check if passed existing points while pressing the key AND moving
            let currentAnchorLeftX, currentAnchorRightX;
            if (this.facingDirection === 'right') { 
                currentAnchorLeftX = this.x + this.baseWidth / 2 - this.footAnchorHorizontalOffset;
                currentAnchorRightX = this.x + this.baseWidth / 2 + this.footAnchorHorizontalOffset;
            } else {
                currentAnchorLeftX = this.x + this.baseWidth / 2 + this.footAnchorHorizontalOffset;
                currentAnchorRightX = this.x + this.baseWidth / 2 - this.footAnchorHorizontalOffset;
            }

            // Use actual velocity direction for passing check
            if (actualMoveDirection === 1 && currentAnchorLeftX > this.fixedLeftFootTargetPointX && currentAnchorRightX > this.fixedRightFootTargetPointX) {
                recalculateTargets = true;
            } else if (actualMoveDirection === -1 && currentAnchorLeftX < this.fixedLeftFootTargetPointX && currentAnchorRightX < this.fixedRightFootTargetPointX) {
                recalculateTargets = true;
            }
        }

        // --- Update Fixed Foot Targets --- 
        if (recalculateTargets) {
            let targetFootAnchorLeftX, targetFootAnchorRightX;
             // Calculate offset from the CURRENT (lerped) hip anchor
             if (this.facingDirection === 'right') { 
                 targetFootAnchorLeftX = this.currentHipAnchorX - this.footAnchorHorizontalOffset;
                 targetFootAnchorRightX = this.currentHipAnchorX + this.footAnchorHorizontalOffset;
             } else {
                 targetFootAnchorLeftX = this.currentHipAnchorX + this.footAnchorHorizontalOffset;
                 targetFootAnchorRightX = this.currentHipAnchorX - this.footAnchorHorizontalOffset;
             }
            const targetOffset = 30;
            // Store current foot positions as previous positions before updating targets
            this.previousLeftFootX = this.currentLeftFootX;
            this.previousRightFootX = this.currentRightFootX;
            // Calculate forward targets based on ACTUAL move direction
            this.fixedLeftFootTargetPointX = targetFootAnchorLeftX + actualMoveDirection * targetOffset;
            this.fixedRightFootTargetPointX = targetFootAnchorRightX + actualMoveDirection * targetOffset;
            // Toggle which foot steps forward next time
            this.isLeftFootStepping = !this.isLeftFootStepping;
        } else if (stoppedEffectiveMovement) {
            // Clear targets immediately on key release OR when movement stops
            this.fixedLeftFootTargetPointX = null;
            this.fixedRightFootTargetPointX = null;
            this.previousLeftFootX = null;
            this.previousRightFootX = null;
            // Reset stepping state when stopped
            this.isLeftFootStepping = true; 
        }

        // Update last key direction for next frame's comparison (only if actually moving with key)
        this.lastDirectionKeyPressed = (isPressingMoveKey && actualMoveDirection === currentKeyDirection) ? currentKeyDirection : 0;

        // --- Determine Target Foot X Positions --- 
        let targetFootXLeft, targetFootXRight;

        if (this.fixedLeftFootTargetPointX !== null && this.fixedRightFootTargetPointX !== null && this.previousLeftFootX !== null && this.previousRightFootX !== null) {
             // We are actively moving and have targets (Logic remains the same as before)
            if (actualMoveDirection === 1) { // Moving Right
                if (this.isLeftFootStepping) {
                    targetFootXLeft = this.fixedLeftFootTargetPointX;  // Left foot steps forward to white point
                    targetFootXRight = this.previousRightFootX; // Right foot stays back at black point
                } else {
                    targetFootXLeft = this.previousLeftFootX;  // Left foot stays back at black point
                    targetFootXRight = this.fixedRightFootTargetPointX; // Right foot steps forward to white point
                }
            } else if (actualMoveDirection === -1) { // Moving Left
                 if (this.isLeftFootStepping) { // Stepping foot targets the fixed point
                    targetFootXLeft = this.fixedLeftFootTargetPointX; // Left foot steps forward to white point
                    targetFootXRight = this.previousRightFootX; // Right foot stays back at black point
                 } else { // Other foot targets the fixed point
                    targetFootXLeft = this.previousLeftFootX; // Left foot stays back at black point
                    targetFootXRight = this.fixedRightFootTargetPointX; // Right foot steps forward to white point
                 }
            } else { // Should not happen if targets are set, but safety fallback
                // Default to anchors if direction is somehow 0 while targets exist
                // BASE ANCHORS ON CURRENT HIP POSITION
                let currentAnchorXLeftFallback, currentAnchorXRightFallback;
                 if (this.facingDirection === 'right') {
                    currentAnchorXLeftFallback = this.currentHipAnchorX - this.footAnchorHorizontalOffset;
                    currentAnchorXRightFallback = this.currentHipAnchorX + this.footAnchorHorizontalOffset;
                 } else {
                    currentAnchorXLeftFallback = this.currentHipAnchorX + this.footAnchorHorizontalOffset;
                    currentAnchorXRightFallback = this.currentHipAnchorX - this.footAnchorHorizontalOffset;
                 }
                targetFootXLeft = currentAnchorXLeftFallback;
                targetFootXRight = currentAnchorXRightFallback;
            }

        } else {
            // Not moving, target the natural anchor points relative to CURRENT HIP
            let currentAnchorXLeft, currentAnchorRightX;
            if (this.facingDirection === 'right') {
                currentAnchorXLeft = this.currentHipAnchorX - this.footAnchorHorizontalOffset;
                currentAnchorRightX = this.currentHipAnchorX + this.footAnchorHorizontalOffset;
            } else {
                currentAnchorXLeft = this.currentHipAnchorX + this.footAnchorHorizontalOffset;
                currentAnchorRightX = this.currentHipAnchorX - this.footAnchorHorizontalOffset;
            }
            targetFootXLeft = currentAnchorXLeft;
            targetFootXRight = currentAnchorRightX;
        }

        // --- Lerp Current Foot Positions ---
        this.currentLeftFootX = lerp(this.currentLeftFootX, targetFootXLeft, this.footLerpFactor);
        this.currentRightFootX = lerp(this.currentRightFootX, targetFootXRight, this.footLerpFactor);

        // --- Calculate Target Eye Positions (based on base dimensions) ---
        this.targetEyeY = this.y + this.baseHeight / 4;
        if (this.facingDirection === 'right') { 
            this.targetLeftEyeX = this.x + this.baseWidth / 3;
            this.targetRightEyeX = this.x + this.baseWidth * 2 / 3;
        } else {
            this.targetLeftEyeX = this.x + this.baseWidth * 2 / 3;
            this.targetRightEyeX = this.x + this.baseWidth / 3;
        }

        // --- Lerp Current Eye Positions Towards Target ---
        this.currentLeftEyeX = lerp(this.currentLeftEyeX, this.targetLeftEyeX, this.eyeLerpFactor);
        this.currentRightEyeX = lerp(this.currentRightEyeX, this.targetRightEyeX, this.eyeLerpFactor);
        this.currentEyeY = lerp(this.currentEyeY, this.targetEyeY, this.eyeLerpFactor);

        // --- Update Eye Midpoint based on Current Lerped Positions ---
        this.eyeMidpointX = (this.currentLeftEyeX + this.currentRightEyeX) / 2;
        this.eyeMidpointY = this.currentEyeY;

        // --- Update Hip Anchor --- 
        // Calculate Target Hip Anchor (Center of player body)
        this.targetHipAnchorX = this.x + this.baseWidth / 2;
        this.targetHipAnchorY = this.y + this.baseHeight / 2; // Center Y for now
        // Lerp Current Hip Anchor towards Target
        this.currentHipAnchorX = lerp(this.currentHipAnchorX, this.targetHipAnchorX, this.hipLerpFactor);
        this.currentHipAnchorY = lerp(this.currentHipAnchorY, this.targetHipAnchorY, this.hipLerpFactor);

        // --- Calculate Squash & Stretch Targets ---
        const verticalVelocityFactor = Math.abs(this.vy) / 15; // Normalize vy somewhat (adjust 15 as needed)
        const clampedFactor = Math.min(verticalVelocityFactor, 1.0); // Clamp factor to 1

        if (Math.abs(this.vy) > 0.5) { // Only apply effect if moving vertically significantly
             if (this.vy > 0) { // Moving down (stretch vertically)
                 this.targetHeight = this.baseHeight * (1 + clampedFactor * this.squashStretchFactor);
                 this.targetWidth = (this.baseWidth * this.baseHeight) / this.targetHeight; // Maintain area
             } else { // Moving up (squash vertically)
                 this.targetHeight = this.baseHeight * (1 - clampedFactor * this.squashStretchFactor);
                 this.targetWidth = (this.baseWidth * this.baseHeight) / this.targetHeight; // Maintain area
             }
        } else {
            // Return to base size when not moving vertically
            this.targetWidth = this.baseWidth;
            this.targetHeight = this.baseHeight;
        }

        // Clamp target dimensions to prevent extreme values (e.g., min 50%, max 150%)
        this.targetWidth = Math.max(this.baseWidth * 0.5, Math.min(this.baseWidth * 1.5, this.targetWidth));
        this.targetHeight = Math.max(this.baseHeight * 0.5, Math.min(this.baseHeight * 1.5, this.targetHeight));

        // --- Lerp Current Dimensions Towards Target Dimensions ---
        this.currentWidth = lerp(this.currentWidth, this.targetWidth, this.squashStretchLerpFactor);
        this.currentHeight = lerp(this.currentHeight, this.targetHeight, this.squashStretchLerpFactor);
    }

    draw(ctx: CanvasRenderingContext2D, isDebugMode: boolean = false, otherPlayerEyeMidpoint: { x: number, y: number } | null = null) {
        // Draw all active bombs
        for (const bomb of this.bombs) {
            bomb.draw(ctx);
        }

        // --- Draw Trajectory Preview if Charging ---
        if (this.isChargingBomb && this.trajectoryPoints.length > 1) {
            ctx.save(); // Save context state
            
            // Use a dashed line for the trajectory
            ctx.setLineDash([5, 5]); 
            
            // Style the trajectory line
            const chargeRatio = this.bombChargeTime / this.MAX_BOMB_CHARGE_TIME;
            const startColor = [255, 255, 255]; // White
            const endColor = [255, 0, 0]; // Red
            const r = Math.round(lerp(startColor[0], endColor[0], chargeRatio));
            const g = Math.round(lerp(startColor[1], endColor[1], chargeRatio));
            const b = Math.round(lerp(startColor[2], endColor[2], chargeRatio));
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.7)`; // Color changes with charge
            ctx.lineWidth = 2;
            
            // Draw the trajectory line segments
            ctx.beginPath();
            ctx.moveTo(this.trajectoryPoints[0].x, this.trajectoryPoints[0].y);
            for (let i = 1; i < this.trajectoryPoints.length; i++) {
                ctx.lineTo(this.trajectoryPoints[i].x, this.trajectoryPoints[i].y);
            }
            ctx.stroke();
            
            // Draw small circles at each point for emphasis
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
            for (const point of this.trajectoryPoints) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore(); // Restore context state (including line dash)
        }

        const armCenterY = this.y + this.baseHeight / 2; // Use baseHeight for arm vertical center
        // Calculate Foot Anchor Y position (used for feet and debug anchors)
        const footAnchorY = this.currentHipAnchorY + this.baseHeight / 2 + this.hitboxPaddingY;

        // Use CURRENT (lerped) eye positions for drawing
        const eyeSize = this.baseWidth / 8; // Eye size based on base width
        const currentEyeY = this.currentEyeY; 
        const currentLeftEyeX = this.currentLeftEyeX;
        const currentRightEyeX = this.currentRightEyeX;
        
        // Calculate pupil positions and offset based on CURRENT eye positions
        const pupilSize = eyeSize / 2;
        let pupilOffsetX = 0; // Default to center
        let pupilOffsetY = 0; // Default to center
        const maxPupilOffset = eyeSize / 3; // Max distance pupil can move from eye center

        if (otherPlayerEyeMidpoint) {
            // Look towards the other player's eye midpoint (using CURRENT eye midpoint)
            const directionX = otherPlayerEyeMidpoint.x - this.eyeMidpointX;
            const directionY = otherPlayerEyeMidpoint.y - this.eyeMidpointY;
            const distance = Math.sqrt(directionX * directionX + directionY * directionY);

            if (distance > 1) { // Add a small deadzone to prevent jitter when close
                // Normalize the direction vector
                const normalizedX = directionX / distance;
                const normalizedY = directionY / distance;

                // Calculate the offset, clamped by maxPupilOffset
                // We scale the normalized vector by the max offset allowed
                pupilOffsetX = normalizedX * maxPupilOffset;
                pupilOffsetY = normalizedY * maxPupilOffset;
            }
           
        } else {
             // Fallback: Look horizontally in the direction the player is facing (if no target)
             pupilOffsetX = this.facingDirection === 'right' ? maxPupilOffset : -maxPupilOffset;
             // pupilOffsetY remains 0 for horizontal fallback
        }
        
        // Final pupil positions relative to CURRENT eye centers
        const leftPupilX = currentLeftEyeX + pupilOffsetX;
        const leftPupilY = currentEyeY + pupilOffsetY; // Apply Y offset
        const rightPupilX = currentRightEyeX + pupilOffsetX;
        const rightPupilY = currentEyeY + pupilOffsetY; // Apply Y offset


        // Anchor positions (target for the lagging shoulder - based on base width)
        let anchorTopShoulderX, anchorBottomShoulderX;
        if (this.facingDirection === 'right') {
            anchorTopShoulderX = this.x + this.baseWidth / 2 - this.armHorizontalOffset;
            anchorBottomShoulderX = this.x + this.baseWidth / 2 + this.armHorizontalOffset;
        } else { // facingDirection === 'left'
            anchorTopShoulderX = this.x + this.baseWidth / 2 + this.armHorizontalOffset;
            anchorBottomShoulderX = this.x + this.baseWidth / 2 - this.armHorizontalOffset;
        }

        // Calculate hand center points based on current angle and distance FROM CURRENT SHOULDER
        const topHandCenterX = this.currentTopShoulderX + Math.cos(this.topArmAngle) * this.handDistanceFromShoulder;
        const topHandCenterY = armCenterY + Math.sin(this.topArmAngle) * this.handDistanceFromShoulder; // Use armCenterY based on baseHeight
        const bottomHandCenterX = this.currentBottomShoulderX + Math.cos(this.bottomArmAngle) * this.handDistanceFromShoulder;
        const bottomHandCenterY = armCenterY + Math.sin(this.bottomArmAngle) * this.handDistanceFromShoulder; // Use armCenterY based on baseHeight

        // Calculate TARGET Foot Anchor X positions (needed for debug drawing - based on CURRENT HIP X)
        let targetFootAnchorLeftX, targetFootAnchorRightX;
        if (this.facingDirection === 'right') {
            targetFootAnchorLeftX = this.currentHipAnchorX - this.footAnchorHorizontalOffset;
            targetFootAnchorRightX = this.currentHipAnchorX + this.footAnchorHorizontalOffset;
        } else { // facingDirection === 'left'
            targetFootAnchorLeftX = this.currentHipAnchorX + this.footAnchorHorizontalOffset;
            targetFootAnchorRightX = this.currentHipAnchorX - this.footAnchorHorizontalOffset;
        }

        // 1. Draw Bottom Arm (Darker, behind player)
        if (isDebugMode) {
            // Draw Pink Anchor FIRST (at TARGET position)
            ctx.fillStyle = 'pink';
            ctx.beginPath();
            ctx.arc(anchorBottomShoulderX, armCenterY, this.armRadius, 0, Math.PI * 2);
            ctx.fill();

            // Pink Line (Anchor to CURRENT Shoulder)
            ctx.strokeStyle = 'pink';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(anchorBottomShoulderX, armCenterY);
            ctx.lineTo(this.currentBottomShoulderX, armCenterY); // Use current interpolated position
            ctx.stroke();

            // Draw Blue Shoulder LAST (at CURRENT position)
            ctx.fillStyle = 'blue'; // Debug color for shoulder
            ctx.beginPath();
            ctx.arc(this.currentBottomShoulderX, armCenterY, this.armRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Hand Circle (Always drawn)
        ctx.fillStyle = this.armColorDark;
        ctx.beginPath();
        ctx.arc(bottomHandCenterX, bottomHandCenterY, this.handRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw Player Body, Hitbox, AND Foot/Hip Anchors (Debug Only)
        if (isDebugMode) {
            // --- Draw Hip Anchor --- 
            // Target Hip Anchor (Cyan)
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(this.targetHipAnchorX, this.targetHipAnchorY, 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'cyan';
            ctx.font = '10px Arial';
            ctx.fillText('Target Hip', this.targetHipAnchorX + 8, this.targetHipAnchorY - 8);

            // Current Hip Anchor (Green)
            ctx.fillStyle = 'lime';
            ctx.beginPath();
            ctx.arc(this.currentHipAnchorX, this.currentHipAnchorY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.fillText('Current Hip', this.currentHipAnchorX + 8, this.currentHipAnchorY + 8);

            // --- Draw Foot Anchors --- 
            // Draw Orange Foot ANCHORS (at target positions, relative to CURRENT HIP Y)
            const footAnchorRadius = 4; // Smaller radius for anchors
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(targetFootAnchorLeftX, footAnchorY, footAnchorRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(targetFootAnchorRightX, footAnchorY, footAnchorRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw lines from Current Hip to Orange Foot Anchors
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.currentHipAnchorX, this.currentHipAnchorY);
            ctx.lineTo(targetFootAnchorLeftX, footAnchorY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.currentHipAnchorX, this.currentHipAnchorY);
            ctx.lineTo(targetFootAnchorRightX, footAnchorY);
            ctx.stroke();

            // Draw STICKY Movement Direction Target Points (White) - Positions unchanged
            if (this.fixedLeftFootTargetPointX !== null && this.fixedRightFootTargetPointX !== null) { 
                const targetPointRadius = 3;
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(this.fixedLeftFootTargetPointX, footAnchorY, targetPointRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.fixedRightFootTargetPointX, footAnchorY, targetPointRadius, 0, Math.PI * 2);
                ctx.fill();

                // Draw black previous position points
                if (this.previousLeftFootX !== null && this.previousRightFootX !== null) {
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(this.previousLeftFootX, footAnchorY, targetPointRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(this.previousRightFootX, footAnchorY, targetPointRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw Player Outline (using base dimensions)
            ctx.strokeStyle = this.color; // Use player color for outline
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.baseWidth, this.baseHeight);

            // Draw Hitbox Outline (using base dimensions + padding)
            ctx.strokeStyle = 'lime'; // Bright green for hitbox
            ctx.lineWidth = 1;
            const hitboxX = this.x - this.hitboxPaddingX;
            const hitboxY = this.y - this.hitboxPaddingY;
            const hitboxWidth = this.baseWidth + this.hitboxPaddingX * 2;
            const hitboxHeight = this.baseHeight + this.hitboxPaddingY * 2;
            ctx.strokeRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
            
            // Draw eye TARGET positions (anchors) and CURRENT positions
            // Target Eye outlines (cyan)
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]); // Dashed for target
            ctx.beginPath();
            ctx.arc(this.targetLeftEyeX, this.targetEyeY, eyeSize, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.targetRightEyeX, this.targetEyeY, eyeSize, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash

            // Current Eye outlines (white - drawn below)
            ctx.strokeStyle = 'white'; 
            ctx.lineWidth = 2; // Thicker for current
            ctx.beginPath();
            ctx.arc(currentLeftEyeX, currentEyeY, eyeSize, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(currentRightEyeX, currentEyeY, eyeSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Add labels for the eyes (position relative to current eye)
            ctx.fillStyle = 'cyan';
            ctx.font = '10px Arial';
            ctx.fillText('L Eye Target', this.targetLeftEyeX - eyeSize, this.targetEyeY - eyeSize - 15);
            ctx.fillText('R Eye Target', this.targetRightEyeX - eyeSize, this.targetEyeY - eyeSize - 15);
            ctx.fillStyle = 'white';
            ctx.fillText('Left Eye', currentLeftEyeX - eyeSize, currentEyeY - eyeSize - 5);
            ctx.fillText('Right Eye', currentRightEyeX - eyeSize, currentEyeY - eyeSize - 5);

             // Draw Eye Midpoint (based on current eyes)
             ctx.fillStyle = 'green';
             ctx.beginPath();
             ctx.arc(this.eyeMidpointX, this.eyeMidpointY, 3, 0, Math.PI * 2);
             ctx.fill();
             ctx.fillText('Eye Midpoint', this.eyeMidpointX - 25, this.eyeMidpointY - 10);

            
            // Pupil positions (red dots, based on current eye positions)
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(leftPupilX, leftPupilY, pupilSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightPupilX, rightPupilY, pupilSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Add labels for pupils
            ctx.fillStyle = 'red';
            ctx.fillText('L Pupil', leftPupilX - pupilSize, leftPupilY + eyeSize + 5);
            ctx.fillText('R Pupil', rightPupilX - pupilSize, rightPupilY + eyeSize + 5);
            
            // Draw connection lines between CURRENT eyes and pupils
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]); // Dashed line
            
            ctx.beginPath();
            ctx.moveTo(currentLeftEyeX, currentEyeY);
            ctx.lineTo(leftPupilX, leftPupilY);
            ctx.stroke();
            
            ctx.beginPath(); 
            ctx.moveTo(currentRightEyeX, currentEyeY);
            ctx.lineTo(rightPupilX, rightPupilY);
            ctx.stroke();
            
            ctx.setLineDash([]); // Reset to solid line

            // --- Draw Velocity Vectors --- 
            const centerX = this.x + this.baseWidth / 2; // Center based on base width
            const centerY = this.y + this.baseHeight / 2; // Center based on base height
            const velocityScale = 10; // Adjust to make vectors more visible

            // 1. Total Velocity Vector (Magenta)
            const endTotalX = centerX + this.vx * velocityScale;
            const endTotalY = centerY + this.vy * velocityScale;
            ctx.strokeStyle = 'magenta';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(endTotalX, endTotalY);
            ctx.stroke();
            // Arrowhead for total velocity
            this.drawArrowhead(ctx, centerX, centerY, endTotalX, endTotalY, 5, 'magenta');
            ctx.fillStyle = 'magenta';
            ctx.font = '10px Arial';
            ctx.fillText(`Vel (${this.vx.toFixed(1)}, ${this.vy.toFixed(1)})`, endTotalX + 5, endTotalY);

            // 2. Horizontal Velocity Vector (Red)
            const endHorizontalX = centerX + this.vx * velocityScale;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(endHorizontalX, centerY); 
            ctx.stroke();
            this.drawArrowhead(ctx, centerX, centerY, endHorizontalX, centerY, 4, 'red');
            ctx.fillStyle = 'red';
            ctx.fillText(`Vx (${this.vx.toFixed(1)})`, endHorizontalX + 5, centerY - 5);

            // 3. Vertical Velocity Vector (Blue)
            const endVerticalY = centerY + this.vy * velocityScale;
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX, endVerticalY); 
            ctx.stroke();
            this.drawArrowhead(ctx, centerX, centerY, centerX, endVerticalY, 4, 'blue');
            ctx.fillStyle = 'blue';
            ctx.fillText(`Vy (${this.vy.toFixed(1)})`, centerX + 5, endVerticalY + 5);

        } else {
            // Draw an improved character with rounded corners and gradient body
            // Use CURRENT animated dimensions
            
            // 1. Draw body with a gradient
            const bodyGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.currentWidth, this.y + this.currentHeight);
            bodyGradient.addColorStop(0, this.color);
            bodyGradient.addColorStop(1, this.adjustColor(this.color, -30)); // Darker variant
            
            // Rounded rectangle for the body using animated dimensions
            this.roundRect(ctx, this.x, this.y, this.currentWidth, this.currentHeight, 10, bodyGradient);
            
            // 2. Draw eyes using CURRENT (lerped) positions
            // White of the eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(currentLeftEyeX, currentEyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(currentRightEyeX, currentEyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils (looking towards other player or facing direction)
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(leftPupilX, leftPupilY, pupilSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightPupilX, rightPupilY, pupilSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 3. Draw a mouth (centered based on current width)
            const mouthY = this.y + this.currentHeight / 2; // Center mouth vertically in animated body
            const mouthWidth = this.currentWidth / 3; // Scale mouth width
            
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // Smile when moving, neutral when still
            if (Math.abs(this.vx) > 0.5) {
                // Smile
                ctx.arc(this.x + this.currentWidth / 2, mouthY, mouthWidth / 2, 0, Math.PI);
            } else {
                // Neutral line centered
                const neutralMouthY = mouthY + eyeSize * 0.5; // Position below eye line
                ctx.moveTo(this.x + this.currentWidth / 2 - mouthWidth / 2, neutralMouthY);
                ctx.lineTo(this.x + this.currentWidth / 2 + mouthWidth / 2, neutralMouthY);
            }
            ctx.stroke();
        }

        // Draw Feet (Always visible, using LERPED X and current Y based on calculation above)
        ctx.fillStyle = this.adjustColor(this.color, -50); // Darker version of player color
        ctx.beginPath();
        ctx.arc(this.currentLeftFootX, footAnchorY, this.footRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.currentRightFootX, footAnchorY, this.footRadius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw Top Arm (Lighter, in front of player)
        if (isDebugMode) {
            // Draw Pink Anchor FIRST (at TARGET position)
            ctx.fillStyle = 'pink';
            ctx.beginPath();
            ctx.arc(anchorTopShoulderX, armCenterY, this.armRadius, 0, Math.PI * 2);
            ctx.fill();

            // Pink Line (Anchor to CURRENT Shoulder)
            ctx.strokeStyle = 'pink';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(anchorTopShoulderX, armCenterY);
            ctx.lineTo(this.currentTopShoulderX, armCenterY); // Use current interpolated position
            ctx.stroke();

            // Draw Blue Shoulder LAST (at CURRENT position)
            ctx.fillStyle = 'blue'; // Debug color for shoulder
            ctx.beginPath();
            ctx.arc(this.currentTopShoulderX, armCenterY, this.armRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        // Hand Circle (Always drawn)
        ctx.fillStyle = this.armColorLight;
        ctx.beginPath();
        ctx.arc(topHandCenterX, topHandCenterY, this.handRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Helper method to create rounded rectangles
    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fillStyle: string | CanvasGradient) {
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    // Helper method to adjust color brightness
    private adjustColor(color: string, amount: number): string {
        let originalColor = color;
        let hexColor = color;

        // Basic implementation for named colors (returns hex)
        const colors: {[key: string]: string} = {
            'red': '#ff6b6b', 'lightcoral': '#f08080', 'darkred': '#8b0000',
            'blue': '#6ba5ff', 
            'green': '#6bff6b',
            'yellow': '#ffff6b',
            'orange': '#ffa56b',
            'purple': '#a56bff',
            'pink': '#ff6bff',
            'brown': '#a56b6b',
            'black': '#000000',
            'white': '#ffffff',
            'gray': '#808080', // Changed gray hex
        };

        // Convert named color to hex if found
        if (colors[color.toLowerCase()]) {
            hexColor = colors[color.toLowerCase()];
        }

        // Only works with hex colors 
        if (hexColor.startsWith('#')) {
            // Simple brightness adjustment for hex colors
            let usePound = false;
            if (hexColor[0] === "#") {
                hexColor = hexColor.slice(1);
                usePound = true;
            }
             // Handle short hex codes
             if (hexColor.length === 3) {
                hexColor = hexColor.split('').map(char => char + char).join('');
             }

            // Ensure hex is valid before parsing
            if (hexColor.length === 6 && /^[0-9a-fA-F]+$/.test(hexColor)) {
                const num = parseInt(hexColor, 16);
                let r = (num >> 16) + amount;
                if (r > 255) r = 255;
                else if (r < 0) r = 0;
                let b = ((num >> 8) & 0x00FF) + amount;
                if (b > 255) b = 255;
                else if (b < 0) b = 0;
                let g = (num & 0x0000FF) + amount;
                if (g > 255) g = 255;
                else if (g < 0) g = 0;
                // Convert back to hex, ensuring proper padding
                const adjustedHex = ((r << 16) + (b << 8) + g).toString(16).padStart(6, '0');
                return (usePound ? "#" : "") + adjustedHex;
            } 
        }
        
       
        // Return original color if it wasn't a valid hex or named color
        return originalColor; 
    }

    // Helper function to draw arrowheads
    private drawArrowhead(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, headLength: number, color: string) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }

    // Calculate the bomb's trajectory based on current charge
    calculateTrajectory() {
        this.trajectoryPoints = [];
        const chargeRatio = this.bombChargeTime / this.MAX_BOMB_CHARGE_TIME;
        const throwStrength = lerp(this.MIN_BOMB_THROW_STRENGTH, this.MAX_BOMB_THROW_STRENGTH, chargeRatio);
        
        let simX = this.x + this.baseWidth / 2;
        let simY = this.y + this.baseHeight / 4; // Start from approx. throw point
        let simVX = this.facingDirection === 'right' ? throwStrength : -throwStrength;
        let simVY = -5; // Initial upward velocity (same as Bomb constructor)
        const simGravity = 0.3; // Use bomb's gravity
        const timeStep = 3; // Calculate points every few frames for performance
        const maxSteps = 60; // Limit simulation steps

        for (let i = 0; i < maxSteps; i++) {
             // Only add point every few steps
            if (i % timeStep === 0) { 
                this.trajectoryPoints.push({ x: simX, y: simY });
            }

            // Simulate physics steps (simplified)
            simVY += simGravity;
            simX += simVX;
            simY += simVY;
            
            // Basic floor check - stop simulation if it goes too low
            if (simY > this.y + this.baseHeight * 2) { 
                break;
            }
        }
    }

    // Add method to throw a bomb
    throwBomb() {
        // Calculate throw strength based on charge time
        const chargeRatio = this.bombChargeTime / this.MAX_BOMB_CHARGE_TIME;
        const throwStrength = lerp(this.MIN_BOMB_THROW_STRENGTH, this.MAX_BOMB_THROW_STRENGTH, chargeRatio);
        
        const bombX = this.x + this.baseWidth / 2;
        const bombY = this.y + this.baseHeight / 4; // Throw from chest height
        
        // Use the calculated strength when creating the bomb
        this.bombs.push(new Bomb(bombX, bombY, this.facingDirection, throwStrength));
        this.bombCooldown = 30; // Still apply a short cooldown after throwing
    }
}

// Added GroundBlockData interface for type safety in Player.ts
interface GroundBlockData {
    color: string;
} 