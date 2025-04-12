import React, { useRef, useEffect, useState } from "react";
import { Player } from "../game/Player";
import { Camera } from "../game/Camera";
import { PerlinNoise } from "../game/utils";

// Interface for ground block data
interface GroundBlockData {
  color: string;
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Refs for both players
  const player1Ref = useRef<Player | null>(null);
  const player2Ref = useRef<Player | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  // Use state to track keys pressed
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false); // Debug mode state
  // Sky background optimization
  const skyCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ref to store ground block data using a Map (key: "gridX,gridY")
  const groundMapRef = useRef<Map<string, GroundBlockData>>(new Map());
  const environmentInitializedRef = useRef<boolean>(false);
  const blockSize = 50; // Size of each ground block

  // Key configurations
  const player1Keys = { left: "a", right: "d", jump: "w", bomb: "e" };
  const player2Keys = { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", bomb: "Control" };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle debug mode on `~` key (usually Backquote `)
      if (event.key === "`") {
        setIsDebugMode((prev) => !prev);
      }
      setKeys((prevKeys) => ({ ...prevKeys, [event.key]: true }));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setKeys((prevKeys) => ({ ...prevKeys, [event.key]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Create sky canvas once
  const createSkyCanvas = (width: number, height: number) => {
    if (!skyCanvasRef.current) {
      skyCanvasRef.current = document.createElement("canvas");
    }

    const skyCanvas = skyCanvasRef.current;
    skyCanvas.width = width;
    skyCanvas.height = height;

    const skyCtx = skyCanvas.getContext("2d");
    if (!skyCtx) return;

    // Create a more detailed sky gradient
    const skyGradient = skyCtx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, "#0a1740"); // Deep blue at the top
    skyGradient.addColorStop(0.2, "#1a2980"); // Royal blue
    skyGradient.addColorStop(0.5, "#26d0ce"); // Cyan
    skyGradient.addColorStop(0.8, "#c5e5e7"); // Light blue
    skyGradient.addColorStop(1, "#def3f6"); // Almost white at the horizon

    skyCtx.fillStyle = skyGradient;
    skyCtx.fillRect(0, 0, width, height);

    // Add some subtle clouds
    skyCtx.fillStyle = "rgba(255, 255, 255, 0.3)";

    // Draw a few clouds at different positions
    const drawCloud = (x: number, y: number, size: number) => {
      skyCtx.beginPath();
      skyCtx.arc(x, y, size, 0, Math.PI * 2);
      skyCtx.arc(x + size * 0.8, y, size * 0.7, 0, Math.PI * 2);
      skyCtx.arc(x + size * 1.5, y, size * 0.9, 0, Math.PI * 2);
      skyCtx.arc(x + size * 0.3, y - size * 0.4, size * 0.6, 0, Math.PI * 2);
      skyCtx.arc(x + size, y - size * 0.4, size * 0.8, 0, Math.PI * 2);
      skyCtx.fill();
    };

    // Draw some scattered clouds
    drawCloud(width * 0.1, height * 0.2, 30);
    drawCloud(width * 0.5, height * 0.1, 40);
    drawCloud(width * 0.8, height * 0.15, 35);
    drawCloud(width * 0.3, height * 0.25, 25);

    // Draw Sun
    const sunX = width * 0.8;
    const sunY = height * 0.15;
    const sunRadius = 80;

    // Sun glow
    const sunGradient = skyCtx.createRadialGradient(sunX, sunY, 20, sunX, sunY, sunRadius);
    sunGradient.addColorStop(0, "#fff8a6"); // Bright center
    sunGradient.addColorStop(0.7, "#ffda29"); // Main sun color
    sunGradient.addColorStop(1, "rgba(255, 218, 41, 0)"); // Transparent edge

    skyCtx.fillStyle = sunGradient;
    skyCtx.beginPath();
    skyCtx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    skyCtx.fill();

    // Bright sun center
    skyCtx.fillStyle = "#ffffff";
    skyCtx.beginPath();
    skyCtx.arc(sunX, sunY, 20, 0, Math.PI * 2);
    skyCtx.fill();
  };

  // Game Setup and Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Define world boundaries (optional now, but can be useful)
    // const worldWidth = canvas.width * 5;
    // const worldStartX = -canvas.width * 2;

    let groundLevelY = canvas.height - blockSize; // Top Y of the ground level

    // Create the sky canvas once
    createSkyCanvas(canvas.width, canvas.height);

    // Initialize noise generator
    const noiseGenerator = new PerlinNoise(12345); // Use a fixed seed
    const noiseScale = 0.05;
    const terrainAmplitude = 4; // Max height variation in blocks (can be adjusted)

    // Calculate total grid rows and set minimum ground level near the bottom
    const totalGridRows = Math.ceil(canvas.height / blockSize);
    const minGroundGridY = totalGridRows - 22; // Lowered base level significantly (was - 2)
    const terrainDepth = 10; // How many blocks deep to make the terrain

    // Initialize environment only once
    if (!environmentInitializedRef.current) {
      const player1SpawnX = 100;
      const player2SpawnX = 200;

      // --- Generate Terrain using Perlin Noise (Revised Approach) ---
      groundMapRef.current.clear();
      const terrainWidthInBlocks = 200;
      const startTerrainX = -Math.floor(terrainWidthInBlocks / 2);

      for (let gx = startTerrainX; gx < startTerrainX + terrainWidthInBlocks; gx++) {
        // Get noise value (-1 to 1 approx)
        const noiseValue = noiseGenerator.noise(gx * noiseScale);
        // Scale noise to 0-1 range
        const scaledNoise = (noiseValue + 1) / 2;
        // Calculate height variation for this column (0 to terrainAmplitude)
        const columnHeightVariation = Math.round(scaledNoise * terrainAmplitude);
        // Determine the top-most block Y for this column (builds UP from min level)
        const columnTopY = minGroundGridY - columnHeightVariation;

        // Fill blocks downwards from the calculated top Y to a fixed depth
        for (let gy = columnTopY; gy < columnTopY + terrainDepth; gy++) {
          const blockKey = `${gx},${gy}`;
          let color = "#808080"; // Default stone

          // Color based on depth relative to the surface (columnTopY)
          const depth = gy - columnTopY;
          if (depth === 0) {
            // Top layer is green grass
            color = "#2E8B57";
          } else if (depth < 3) {
            // Layer below grass is dirt
            color = "#A0522D";
          }
          // Implicitly stone otherwise

          groundMapRef.current.set(blockKey, { color: color });
        }
      }

      // Find a suitable spawn Y based on the generated terrain near spawn X
      const spawnCheckX = Math.floor(player1SpawnX / blockSize);
      let foundSpawnY = false;
      let spawnGridY = minGroundGridY; // Start searching from the min level
      // Search upwards from the minimum possible ground level
      for (let gy = minGroundGridY + terrainDepth; gy >= minGroundGridY - terrainAmplitude; gy--) {
        if (groundMapRef.current.has(`${spawnCheckX},${gy}`)) {
          spawnGridY = gy; // Found the top-most block at this X
          foundSpawnY = true;
          break;
        }
      }

      // If ground found, spawn above it. Otherwise, fallback near min level.
      const finalSpawnY = (foundSpawnY ? spawnGridY * blockSize : minGroundGridY * blockSize) - 100;

      if (!player1Ref.current) {
        player1Ref.current = new Player(player1SpawnX, finalSpawnY, 50, 50);
        player1Ref.current.color = "#ff6b6b";
      }
      if (!player2Ref.current) {
        player2Ref.current = new Player(player2SpawnX, finalSpawnY, 50, 50);
        player2Ref.current.color = "#6ba5ff";
      }

      environmentInitializedRef.current = true;
    } else {
      // Ensure players exist if env already initialized (e.g., hot reload)
      if (!player1Ref.current || !player2Ref.current) {
        // Handle appropriately - maybe re-initialize players or throw error
        console.error("Players not initialized after environment setup!");
        return;
      }
    }

    const player1 = player1Ref.current!;
    const player2 = player2Ref.current!;

    if (!cameraRef.current) {
      cameraRef.current = new Camera([player1, player2], canvas.width, canvas.height);
    }
    const camera = cameraRef.current;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      camera.canvasWidth = canvas.width;
      camera.canvasHeight = canvas.height;

      // Recalculate ground level Y (doesn't affect block data, but needed for potential adjustments)
      const newGroundLevelY = canvas.height - blockSize;

      // Simple player adjustment: if player was near old ground, move near new ground
      // A more robust solution might involve checking the map again
      const oldGroundLevelY = groundLevelY;
      if (Math.abs(player1.y + player1.baseHeight + player1.hitboxPaddingY - oldGroundLevelY) < blockSize) {
        player1.y = newGroundLevelY - player1.baseHeight - player1.hitboxPaddingY;
      }
      if (Math.abs(player2.y + player2.baseHeight + player2.hitboxPaddingY - oldGroundLevelY) < blockSize) {
        player2.y = newGroundLevelY - player2.baseHeight - player2.hitboxPaddingY;
      }
      groundLevelY = newGroundLevelY; // Update ground level reference

      // Recreate sky canvas when resizing
      createSkyCanvas(canvas.width, canvas.height);
    };

    const gameLoop = () => {
      if (!context || !player1 || !player2 || !camera) {
        cancelAnimationFrame(animationFrameId);
        return;
      }

      // Update game state (pass ground map and block size)
      player1.update(keys, groundMapRef.current, blockSize, player1Keys);
      player2.update(keys, groundMapRef.current, blockSize, player2Keys);
      camera.update();

      // --- Drawing ---
      // Clear canvas and draw the pre-rendered sky
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (skyCanvasRef.current) {
        context.drawImage(skyCanvasRef.current, 0, 0);
      }

      // Apply camera transform
      camera.applyTransform(context);

      // --- Calculate Dynamic View Bounds for Rendering ---
      // 1. Get Camera's Center Point in World Space (Camera x/y IS the center)
      const viewCenterX = camera.x;
      const viewCenterY = camera.y;

      // 2. Find the World-Space Bounding Box containing both players
      const p1Left = player1.x - player1.hitboxPaddingX;
      const p1Right = player1.x + player1.baseWidth + player1.hitboxPaddingX;
      const p1Top = player1.y - player1.hitboxPaddingY;
      const p1Bottom = player1.y + player1.baseHeight + player1.hitboxPaddingY;

      const p2Left = player2.x - player2.hitboxPaddingX;
      const p2Right = player2.x + player2.baseWidth + player2.hitboxPaddingX;
      const p2Top = player2.y - player2.hitboxPaddingY;
      const p2Bottom = player2.y + player2.baseHeight + player2.hitboxPaddingY;

      const minPlayerX = Math.min(p1Left, p2Left);
      const maxPlayerX = Math.max(p1Right, p2Right);
      const minPlayerY = Math.min(p1Top, p2Top);
      const maxPlayerY = Math.max(p1Bottom, p2Bottom);

      // 3. Calculate distance needed for view bounds
      const playerDistanceX = maxPlayerX - minPlayerX;
      const playerDistanceY = maxPlayerY - minPlayerY;

      // Figure out how far we should render in each direction from the camera center
      const canvasWorldWidth = camera.canvasWidth / camera.scale;
      const canvasWorldHeight = camera.canvasHeight / camera.scale;

      // Use the larger of: canvas half-width, player distance, or distance from center to player edge
      const distanceLeftFromCenter = Math.abs(viewCenterX - minPlayerX);
      const distanceRightFromCenter = Math.abs(maxPlayerX - viewCenterX);
      const requiredHalfWidth = Math.max(canvasWorldWidth / 2, playerDistanceX, distanceLeftFromCenter, distanceRightFromCenter);

      // Same for vertical dimension
      const distanceTopFromCenter = Math.abs(viewCenterY - minPlayerY);
      const distanceBottomFromCenter = Math.abs(maxPlayerY - viewCenterY);
      const requiredHalfHeight = Math.max(canvasWorldHeight / 2, playerDistanceY, distanceTopFromCenter, distanceBottomFromCenter);

      // Add generous buffer (4 blocks in each direction)
      const viewBuffer = blockSize * 4;

      // Calculate final view bounds
      const viewLeft = viewCenterX - requiredHalfWidth - viewBuffer;
      const viewRight = viewCenterX + requiredHalfWidth + viewBuffer;
      const viewTop = viewCenterY - requiredHalfHeight - viewBuffer;
      const viewBottom = viewCenterY + requiredHalfHeight + viewBuffer;

      // --- Draw Ground Blocks within the Dynamic View ---
      // Calculate grid range - use floor for left/top and ceil for right/bottom to ensure full coverage
      const minGridX = Math.floor(viewLeft / blockSize);
      const maxGridX = Math.ceil(viewRight / blockSize);
      const minGridY = Math.floor(viewTop / blockSize);
      const maxGridY = Math.ceil(viewBottom / blockSize);

      // Debug - if in debug mode, show the calculated view bounds
      if (isDebugMode) {
        context.strokeStyle = "magenta";
        context.lineWidth = 3;
        context.strokeRect(viewLeft, viewTop, viewRight - viewLeft, viewBottom - viewTop);

        // Show the calculated grid range
        context.fillStyle = "white";
        context.font = "14px Arial";
        context.textAlign = "left";
        context.fillText(`View: L:${Math.round(viewLeft)} R:${Math.round(viewRight)} Range:${minGridX}:${maxGridX}`, viewLeft + 10, viewTop + 20);
      }

      context.lineWidth = 1;
      // context.strokeStyle = "#444"; // Set inside the loop based on debug mode

      for (let gy = minGridY; gy <= maxGridY; gy++) {
        for (let gx = minGridX; gx <= maxGridX; gx++) {
          const blockKey = `${gx},${gy}`;
          const blockData = groundMapRef.current.get(blockKey);
          if (blockData) {
            const blockX = gx * blockSize;
            const blockY = gy * blockSize;

            if (isDebugMode) {
              // Debug: Draw outline and coordinates
              context.strokeStyle = "yellow"; // Use a distinct color for debug outlines
              context.strokeRect(blockX, blockY, blockSize, blockSize);

              context.fillStyle = "yellow";
              context.font = "10px Arial";
              context.fillText(`(${blockX}, ${blockY})`, blockX + 2, blockY + 10); // Show coords
            } else {
              // Normal: Fill the block
              context.fillStyle = blockData.color;
              context.fillRect(blockX, blockY, blockSize, blockSize);
              context.strokeStyle = "#444"; // Keep the original stroke for non-debug
              context.strokeRect(blockX, blockY, blockSize, blockSize);
            }
          }
        }
      }

      // Draw Players
      const player1EyeMidpoint = player1.eyeMidpointX ? { x: player1.eyeMidpointX, y: player1.eyeMidpointY } : null;
      const player2EyeMidpoint = player2.eyeMidpointX ? { x: player2.eyeMidpointX, y: player2.eyeMidpointY } : null;

      player1.draw(context, isDebugMode, player2EyeMidpoint);
      player2.draw(context, isDebugMode, player1EyeMidpoint);

      // Draw Player World Coordinates (Debug Only - Inside camera transform)
      if (isDebugMode) {
        context.fillStyle = "lime";
        context.font = "12px Arial";
        const p1CoordText = `P1: (${player1.x.toFixed(1)}, ${player1.y.toFixed(1)})`;
        const p2CoordText = `P2: (${player2.x.toFixed(1)}, ${player2.y.toFixed(1)})`;
        // Position text slightly above and to the right of the player's base rect
        context.fillText(p1CoordText, player1.x + player1.baseWidth + 5, player1.y - 5);
        context.fillText(p2CoordText, player2.x + player2.baseWidth + 5, player2.y - 5);
      }

      // Restore context
      camera.restoreTransform(context);

      // Draw UI (Outside camera transform)
      if (isDebugMode) {
        // Keep existing Debug Mode indicator
        context.fillStyle = "rgba(0, 0, 0, 0.7)"; // Semi-transparent background
        context.fillRect(5, 5, 150, 25);
        context.fillStyle = "white";
        context.font = "16px Arial";
        context.fillText("DEBUG MODE ON", 10, 20);
        camera.drawMidpoint(context); // Keep camera midpoint drawing
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // Initial size set
    gameLoop(); // Start the game loop

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [keys, isDebugMode]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
};

export default GameCanvas;
