import React, { useState } from "react";
import GameCanvas from "./components/GameCanvas";
import GameUI from "./components/GameUI";
import "./App.css";
import StartScreen from "./components/StartScreen";

function App() {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [health, setHealth] = useState({ player1: 100, player2: 100 });

  const handleStartGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="App">
      {gameStarted ? (
        <>
          <GameCanvas />
          {/* Optional: You can uncomment this if you want the GameUI overlay */}
          {/* <GameUI score={score} health={health} /> */}
        </>
      ) : (
        <StartScreen onStartGame={handleStartGame} />
      )}
    </div>
  );
}

export default App;
