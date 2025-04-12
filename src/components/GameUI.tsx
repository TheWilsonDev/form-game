import React from "react";
import "../styles/GameUI.css";

interface GameUIProps {
  score: {
    player1: number;
    player2: number;
  };
  health: {
    player1: number;
    player2: number;
  };
}

const GameUI: React.FC<GameUIProps> = ({ score, health }) => {
  return (
    <div className="game-ui">
      <div className="top-bar">
        <div className="player-stats player1">
          <div className="player-name">Player 1</div>
          <div className="health-bar-container">
            <div className="health-bar player1-health" style={{ width: `${health.player1}%` }}></div>
          </div>
          <div className="player-score">Score: {score.player1}</div>
        </div>

        <div className="game-title">
          <h2>Pixel Platformer</h2>
        </div>

        <div className="player-stats player2">
          <div className="player-name">Player 2</div>
          <div className="health-bar-container">
            <div className="health-bar player2-health" style={{ width: `${health.player2}%` }}></div>
          </div>
          <div className="player-score">Score: {score.player2}</div>
        </div>
      </div>

      <div className="controls-info">
        <div className="player1-controls">
          <p>Player 1: W (Jump), A (Left), D (Right)</p>
        </div>
        <div className="player2-controls">
          <p>Player 2: ↑ (Jump), ← (Left), → (Right)</p>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
