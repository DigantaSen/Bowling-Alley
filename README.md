# 🎳 Bowling Alley Game

A fully-featured 3D bowling game built with Three.js and Cannon.js physics engine, implementing official SOOK (Special Olympics Oklahoma) bowling rules.

## 🎮 Game Features

### Game Modes
1. **Traditional Singles Bowling** - Single player, 3-game average (max score: 300)
2. **Unified Doubles Bowling** - 2 players (Athlete + Partner), combined 3-game average (max score: 600)
3. **Unified Team Bowling** - 4 players (2 Athletes + 2 Partners), combined 3-game average (max score: 1200)

### Official Bowling Rules Implemented

#### Basic Rules
- **Goal**: Knock down all ten pins
- **Frame Structure**: Each frame consists of up to 2 balls to knock down all pins
- **Strike**: All 10 pins knocked down with the first ball (marked as "X")
- **Spare**: All 10 pins knocked down with the second ball (marked as "/")
- **Open Frame**: Frame where not all pins were knocked down
- **Game Length**: 10 frames per game

#### 10th Frame Special Rules
- **Strike on first ball**: Get 2 bonus balls (3 balls total)
- **Spare on first two balls**: Get 1 bonus ball (3 balls total)
- **Open frame**: Only 2 balls (standard)

#### Scoring System
- **Strike**: 10 points + next 2 balls
- **Spare**: 10 points + next 1 ball
- **Open Frame**: Total pins knocked down
- **Perfect Game**: 300 points (12 consecutive strikes)
- **3-Game Average**: Sum of 3 games divided by 3

### Technical Features
- ✅ Realistic 3D physics simulation using Cannon.js
- ✅ Beautiful graphics with Three.js
- ✅ Mouse and touch controls
- ✅ Power meter for throw strength
- ✅ Automatic pin detection and scoring
- ✅ Real-time scorecard updates
- ✅ Multi-player support
- ✅ Lane etiquette visualization (foul line)
- ✅ 3-game series tracking
- ✅ Combined scoring for team modes

## 🎯 How to Play

### Starting the Game
1. **Select Game Mode**: Choose from Singles, Doubles, or Team mode from the dropdown
2. **Click "Start Game"**: Begin your bowling session
3. **Read the Rules**: Click "Show Rules" button to review complete bowling rules

### Controls

#### Mouse Controls
- **Move Mouse**: Aim the bowling ball left/right
- **Click & Hold**: Charge power (power meter fills up)
- **Release**: Throw the ball
- **R Key**: Reset camera to default position

#### Touch Controls (Mobile)
- **Touch & Move**: Aim the ball
- **Touch & Hold**: Charge power
- **Release**: Throw the ball

#### Quick Controls
- **Spacebar**: Quick throw with 70% power (for testing)

### Gameplay Tips
1. **Aiming**: Move your mouse left/right to aim at different pin positions
2. **Power**: Hold the mouse button longer for more power (watch the power meter)
3. **Strike Strategy**: Aim for the "pocket" (between the 1 and 3 pins for right-handers)
4. **Spare Strategy**: Aim at remaining pins after first ball
5. **Watch the Ball**: Camera follows the ball automatically

## 📊 Scoring Display

### Scorecard
- Shows all 10 frames with throws and cumulative scores
- **X** = Strike
- **/** = Spare
- **Number** = Pins knocked down
- **-** = Miss (0 pins)

### Game Summary
- Individual player scores
- 3-game average for each player
- Combined average for team modes
- Maximum possible scores displayed

## 🏆 SOOK Rules Compliance

### Lane Etiquette (Implemented)
✅ Foul line visualization (red line on lane)
✅ Bowl on your own lane (single lane display)
✅ Proper scoring and frame structure

### Game Events
✅ **Traditional Singles** - 1 athlete, 3-game series
✅ **Unified Doubles** - 2 players team scoring
✅ **Unified Team** - 4 players team scoring

### Scoring Accuracy
✅ Proper strike scoring (10 + next 2 balls)
✅ Proper spare scoring (10 + next 1 ball)
✅ 10th frame special rules
✅ 3-game average calculation
✅ Combined team scoring

## 🛠️ Technical Details

### Technologies Used
- **Three.js** (v0.150.1) - 3D graphics rendering
- **Cannon-es** (v0.20.0) - Physics simulation
- **Vanilla JavaScript** - Game logic
- **HTML5 & CSS3** - User interface

### Project Structure
```
Q7_2/
├── index.html              # Main HTML file
├── styles.css              # Styling
├── js/
│   ├── physics-engine.js   # Cannon.js physics wrapper
│   ├── game-objects.js     # Three.js 3D objects
│   ├── scoring-system.js   # Bowling scoring logic
│   ├── game-controller.js  # Main game controller
│   ├── ui-manager.js       # UI updates and interactions
│   └── main.js             # Application entry point
└── README.md              # This file
```

### Architecture
- **Modular Design**: Separated concerns (physics, graphics, scoring, UI)
- **Object-Oriented**: Clean class-based structure
- **Event-Driven**: Responsive UI updates
- **Real-time Physics**: 60 FPS physics simulation

## 🚀 Running the Game

### Local Development
1. Clone or download the project
2. Open `index.html` in a modern web browser
3. No build process required - runs directly in browser!

### Browser Requirements
- Modern browser with WebGL support
- Recommended: Chrome, Firefox, Edge, Safari (latest versions)
- JavaScript must be enabled

### Performance Notes
- Runs at 60 FPS on modern hardware
- Physics simulation is optimized for realistic ball and pin interactions
- Shadows and lighting can be adjusted for lower-end devices

## 🎓 Educational Value

This project demonstrates:
- 3D graphics programming with Three.js
- Physics simulation with Cannon.js
- Game state management
- Complex scoring algorithm implementation
- UI/UX design for games
- Event-driven programming
- Object-oriented JavaScript

## 📝 Rules Reference

### Quick Scoring Guide
- **Strike**: 10 + next 2 balls
- **Spare**: 10 + next 1 ball  
- **Open**: Pins knocked down
- **Perfect Game**: 300 (12 strikes)

### Frame-by-Frame Example
```
Frame 1: Strike (X) = 10 + Frame 2 balls
Frame 2: 7, Spare (/) = 10 + Frame 3 ball
Frame 3: 5, 3 = 8 points
...
Frame 10: Strike, Strike, Strike = 30 points
```

## 🏅 Achievement Targets

### Singles Mode
- **Beginner**: 100+ average
- **Intermediate**: 150+ average
- **Advanced**: 200+ average
- **Expert**: 250+ average
- **Perfect**: 300 score

### Doubles Mode (Combined)
- **Good Team**: 300+ average
- **Great Team**: 400+ average
- **Excellent Team**: 500+ average
- **Perfect Team**: 600 average

### Team Mode (4 Players Combined)
- **Solid Team**: 600+ average
- **Strong Team**: 800+ average
- **Elite Team**: 1000+ average
- **Perfect Team**: 1200 average

## 🐛 Known Limitations

1. **Pin Physics**: Simplified pin shape (cylinder instead of complex pin geometry)
2. **Ball Spin**: Basic angular velocity (no hook ball physics yet)
3. **Lane Conditions**: No oil patterns implemented
4. **AI Players**: All players are human-controlled
5. **Multiplayer**: Local only (no network play)

## 🔮 Future Enhancements

Potential improvements:
- [ ] More realistic pin geometry
- [ ] Ball hooking physics
- [ ] Lane oil patterns
- [ ] AI opponents
- [ ] Leaderboards
- [ ] Sound effects and music
- [ ] Multiple lane views
- [ ] Tournament mode
- [ ] Statistics tracking
- [ ] Ball customization

## 📄 License

This project is created for educational purposes as part of coursework assignment Q7.

## 👨‍💻 Author

**Student ID**: 2025201050  
**Assignment**: Q7 - Bowling Alley Game Implementation  
**Framework**: Three.js  
**Physics**: Cannon.js

---

## 🎉 Enjoy Bowling!

Have fun playing and remember the SOOK motto: "Let me win, but if I cannot win, let me be brave in the attempt!"

**Strike! Spare! Score! 🎳**
