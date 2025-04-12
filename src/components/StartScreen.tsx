import React, { useRef, useEffect } from "react";
import { Player } from "../game/Player";

interface StartScreenProps {
  onStartGame: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player1Ref = useRef<Player | null>(null);
  const player2Ref = useRef<Player | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create players
    if (!player1Ref.current) {
      player1Ref.current = new Player(canvas.width * 0.3, canvas.height * 0.6, 50, 50);
      player1Ref.current.color = "#ff6b6b";
    }
    if (!player2Ref.current) {
      player2Ref.current = new Player(canvas.width * 0.7, canvas.height * 0.6, 50, 50);
      player2Ref.current.color = "#6ba5ff";
    }

    const player1 = player1Ref.current;
    const player2 = player2Ref.current;

    // Animation frame ID for cleanup
    let animationFrameId: number;

    // Draw function for lobby
    const drawLobby = () => {
      if (!context || !player1 || !player2) return;

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      const bgGradient = context.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, "#0a1740");
      bgGradient.addColorStop(0.5, "#26d0ce");
      bgGradient.addColorStop(1, "#def3f6");
      context.fillStyle = bgGradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw title
      context.fillStyle = "white";
      context.font = "bold 48px Arial";
      context.textAlign = "center";
      const title = "Form Game";
      context.fillText(title, canvas.width / 2, canvas.height * 0.15);

      // Draw subtitle
      context.font = "24px Arial";
      context.fillText("A physics-based platformer", canvas.width / 2, canvas.height * 0.22);

      // Draw platforms
      const platformWidth = 150;
      const platformHeight = 30;

      // Platform 1
      context.fillStyle = "#8B4513";
      const platform1X = canvas.width * 0.3 - platformWidth / 2;
      const platform1Y = canvas.height * 0.7;
      context.fillRect(platform1X, platform1Y, platformWidth, platformHeight);
      context.strokeStyle = "#444";
      context.lineWidth = 2;
      context.strokeRect(platform1X, platform1Y, platformWidth, platformHeight);

      // Platform 2
      const platform2X = canvas.width * 0.7 - platformWidth / 2;
      const platform2Y = canvas.height * 0.7;
      context.fillRect(platform2X, platform2Y, platformWidth, platformHeight);
      context.strokeRect(platform2X, platform2Y, platformWidth, platformHeight);

      // Position players on platforms
      player1.x = platform1X + platformWidth / 2 - player1.baseWidth / 2;
      player1.y = platform1Y - player1.baseHeight - player1.hitboxPaddingY;
      player2.x = platform2X + platformWidth / 2 - player2.baseWidth / 2;
      player2.y = platform2Y - player2.baseHeight - player2.hitboxPaddingY;

      // Draw players
      player1.draw(context, false, { x: player2.x + player2.baseWidth / 2, y: player2.y + player2.baseHeight / 4 });
      player2.draw(context, false, { x: player1.x + player1.baseWidth / 2, y: player1.y + player1.baseHeight / 4 });

      // Draw player labels
      context.font = "16px Arial";
      context.textAlign = "center";
      context.fillText("Player 1", player1.x + player1.baseWidth / 2, player1.y - 15);
      context.fillText("Player 2", player2.x + player2.baseWidth / 2, player2.y - 15);

      // Draw controls info
      context.textAlign = "left";
      context.fillStyle = "white";
      context.font = "20px Arial";
      context.fillText("Controls:", 30, canvas.height - 120);

      context.font = "16px Arial";
      context.fillText("Player 1: A/D to move, W to jump, E to throw bombs", 30, canvas.height - 90);
      context.fillText("Player 2: ←/→ to move, ↑ to jump, Ctrl to throw bombs", 30, canvas.height - 60);
      context.fillText("~ key to toggle debug mode", 30, canvas.height - 30);

      // Draw play button
      const buttonWidth = 200;
      const buttonHeight = 60;
      const buttonX = canvas.width - buttonWidth - 30;
      const buttonY = canvas.height - buttonHeight - 30;

      // Button background with gradient
      const buttonGradient = context.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
      buttonGradient.addColorStop(0, "#4CAF50");
      buttonGradient.addColorStop(1, "#45a049");

      context.fillStyle = buttonGradient;
      context.beginPath();
      context.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
      context.fill();

      // Button border
      context.strokeStyle = "#2e7d32";
      context.lineWidth = 3;
      context.stroke();

      // Button text
      context.fillStyle = "white";
      context.font = "bold 24px Arial";
      context.textAlign = "center";
      context.fillText("Play Game", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 8);

      animationFrameId = requestAnimationFrame(drawLobby);
    };

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawLobby();
    };

    // Handle click events for the play button
    const handleClick = (event: MouseEvent) => {
      const buttonWidth = 200;
      const buttonHeight = 60;
      const buttonX = canvas.width - buttonWidth - 30;
      const buttonY = canvas.height - buttonHeight - 30;

      // Check if click is within button bounds
      if (event.clientX >= buttonX && event.clientX <= buttonX + buttonWidth && event.clientY >= buttonY && event.clientY <= buttonY + buttonHeight) {
        onStartGame();
      }
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("click", handleClick);

    // Start animation
    drawLobby();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onStartGame]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
};

export default StartScreen;
