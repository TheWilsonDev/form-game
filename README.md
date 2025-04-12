# 2D Fighting Game

A simple 2D fighting game built with React and TypeScript.

## Game Features

- Split-screen gameplay with two players
- Each player stays on their own half of the screen
- Physics system with gravity and ground collision
- Health system (100 HP each)
- Attack system with hitboxes
- Win condition: Reduce opponent's health to zero

## Controls

### Player 1 (Left side)

- Move left: A
- Move right: D
- Jump: W
- Attack: E

### Player 2 (Right side)

- Move left: Left Arrow
- Move right: Right Arrow
- Jump: Up Arrow
- Attack: Control

## How to Play

1. Each player starts with 100 HP
2. Use your controls to move around and attack your opponent
3. When you attack, a hitbox appears in front of your character
4. If your opponent is within range of your attack, they lose health
5. The first player to reduce their opponent's health to zero wins

## Development

This project was built with:

- React
- TypeScript
- CSS

### Running the Game

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

## Future Enhancements

- Knockback effects
- Cooldown indicators
- Powerups
- Round timer
- Multiple lives
- Visual upgrades (pixel art, sprites, animations)
