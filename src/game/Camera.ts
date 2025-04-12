import { Player } from './Player';
import { lerp } from './utils'; // Assuming lerp is moved to a utils file

export class Camera {
    x: number;
    y: number;
    // Target an array of players
    targets: Player[];
    canvasWidth: number;
    canvasHeight: number;
    lerpFactor: number;
    // Store the calculated midpoint
    midpointX: number;
    midpointY: number;

    // Zoom properties
    scale: number;
    targetScale: number;
    scaleLerpFactor: number;
    minScale: number; // Prevent zooming out too much
    maxScale: number; // Prevent zooming in too much (usually 1)
    paddingX: number; // Padding around players horizontally
    paddingY: number; // Padding around players vertically

    constructor(targets: Player[], canvasWidth: number, canvasHeight: number) {
        this.targets = targets;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.lerpFactor = 0.1; // Positional smoothness
        // Initialize midpoints before calculation
        this.midpointX = 0;
        this.midpointY = 0;

        // Initialize zoom properties
        this.scale = 1;
        this.targetScale = 1;
        this.scaleLerpFactor = 0.05; // Zoom smoothness
        this.minScale = 0.6; // Example: Max zoom out to 60%
        this.maxScale = 1.0; // Example: Max zoom in to 100%
        this.paddingX = 250; // Horizontal padding in pixels
        this.paddingY = 150; // Vertical padding in pixels

        this.calculateMidpoint();
        this.calculateTargetScale();
        this.scale = this.targetScale; // Start at the correct scale

        // Initial position: center the midpoint
        this.x = this.midpointX - this.canvasWidth / 2 / this.scale; // Adjust initial position based on scale
        this.y = this.midpointY - this.canvasHeight / 2 / this.scale;
    }

    calculateMidpoint() {
        if (this.targets.length === 0) return;

        let sumX = 0;
        let sumY = 0;
        this.targets.forEach(target => {
            // Use base dimensions for consistent centering
            sumX += target.x + target.baseWidth / 2;
            sumY += target.y + target.baseHeight / 2;
        });

        this.midpointX = sumX / this.targets.length;
        this.midpointY = sumY / this.targets.length;
    }

    calculateTargetScale() {
        if (this.targets.length === 0) {
            this.targetScale = 1; // Default scale if no targets
            return;
        }

        // Find the bounding box of all targets (using base dimensions)
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        this.targets.forEach(target => {
            const centerX = target.x + target.baseWidth / 2;
            const centerY = target.y + target.baseHeight / 2;
            minX = Math.min(minX, centerX);
            maxX = Math.max(maxX, centerX);
            minY = Math.min(minY, centerY);
            maxY = Math.max(maxY, centerY);
        });

        // Calculate the world dimensions the camera needs to see
        const requiredWorldWidth = (maxX - minX) + this.paddingX * 2;
        const requiredWorldHeight = (maxY - minY) + this.paddingY * 2;

        // Calculate the scale needed based on width and height
        const scaleX = this.canvasWidth / requiredWorldWidth;
        const scaleY = this.canvasHeight / requiredWorldHeight;

        // Use the smaller scale to ensure everything fits
        // Clamp the scale between minScale and maxScale
        this.targetScale = Math.max(this.minScale, Math.min(this.maxScale, Math.min(scaleX, scaleY)));

        // Handle NaN case if dimensions are zero (e.g., single player at exact point)
        if (isNaN(this.targetScale)) {
            this.targetScale = this.maxScale;
        }
    }

    update() {
        this.calculateMidpoint();
        this.calculateTargetScale();

        // Smoothly adjust scale
        this.scale = lerp(this.scale, this.targetScale, this.scaleLerpFactor);

        // Target position remains the midpoint
        // Need to adjust target based on scale for centering
        const targetX = this.midpointX; // Camera world X should target midpoint X
        const targetY = this.midpointY; // Camera world Y should target midpoint Y

        // Lerp camera world position
        this.x = lerp(this.x, targetX, this.lerpFactor);
        this.y = lerp(this.y, targetY, this.lerpFactor);
    }

    // Apply the camera transformation to the canvas context
    applyTransform(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // 1. Translate to the center of the canvas view
        ctx.translate(this.canvasWidth / 2, this.canvasHeight / 2);

        // 2. Scale around the center
        ctx.scale(this.scale, this.scale);

        // 3. Translate the world so the camera's position (midpoint) is at the center
        ctx.translate(Math.round(-this.x), Math.round(-this.y));
    }

    // Restore the canvas context to its original state
    restoreTransform(ctx: CanvasRenderingContext2D) {
        ctx.restore();
    }

    // New method to draw the midpoint for debugging
    drawMidpoint(ctx: CanvasRenderingContext2D) {
        // Convert world midpoint to screen coords for drawing UI element
        const screenMidpointX = (this.midpointX - this.x) * this.scale + this.canvasWidth / 2;
        const screenMidpointY = (this.midpointY - this.y) * this.scale + this.canvasHeight / 2;

        ctx.fillStyle = 'cyan'; // Debug color for midpoint
        ctx.beginPath();
        ctx.arc(screenMidpointX, screenMidpointY, 5, 0, Math.PI * 2); // Draw a small circle
        ctx.fill();
    }
} 