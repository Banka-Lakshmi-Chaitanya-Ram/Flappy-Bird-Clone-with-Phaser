# Flappy Bird (Phaser 3)

A polished, responsive, and human-crafted 2D retro arcade Flappy Bird game built using **HTML5**, **CSS3**, **JavaScript (ES6+)**, and **Phaser 3**.

---

## Highlights & Improvements

- **Authentic Arcade Aesthetic**: Eliminates generic AI templates, bloated dashboard cards, and excessive neon glows in favor of a clean, focused arcade presentation.
- **Universal Multi-Device Responsiveness**: Designed to fit seamlessly into any viewport without vertical or horizontal scrollbars across desktop monitors, laptops, tablets, iPads, iPhones, and Android devices.
- **Classic Arcade Scorecard & Medals**: Authentic game-over scorecard displaying current score, best score, a "NEW" record badge, and achievement medals:
  - 🥉 **Bronze**: Score ≥ 10
  - 🥈 **Silver**: Score ≥ 20
  - 🥇 **Gold**: Score ≥ 30
  - 💎 **Platinum**: Score ≥ 40
- **Touch-First Mobile & Tablet Controls**: Full support for touch tap-to-start, tap-to-flap, and tap-to-restart. Built with input debouncing (350ms on death) to prevent accidental double-tap replay skips.
- **Built-in Web Audio API Synthesizer**: Custom retro 8-bit sound effects (chirp flap, score bell chime, hit impact thud, transition swoosh) requiring zero external audio files. Includes sound mute/unmute toggle.
- **Parallax Background**: Smooth multi-layer scrolling with city skyline and road surface.
- **Clean Game States**: Seamless transitions between `READY` (idle bobbing), `PLAYING` (physics & pipes active), `PAUSED` (freeze timers & physics), and `GAMEOVER` (score summary & replay).

---

## Technologies Used

- **HTML5**: Semantic layout, safe-area viewport metadata, SVG iconography.
- **CSS3 (Vanilla)**: Modern dark arcade styling, CSS `aspect-ratio: 2/3`, dynamic viewport scaling (`100dvh`), `touch-action: none`.
- **JavaScript (ES6+)**: Modular scenes (`BootScene`, `GameScene`), audio synthesis, state machine, and error-tolerant storage persistence.
- **Phaser 3.55.2**: 2D arcade physics engine, texture management, camera flash, and game loops.
- **Web Audio API**: Browser-native real-time sound synthesis.

---

## Project Structure

```text
Flappy Bird Clone with Phaser/
├── index.html          # Semantic HTML5 entry point with responsive arcade frame
├── style.css           # Clean retro arcade styles and multi-device viewport engine
├── app.js              # Complete Phaser 3 game implementation (BootScene, GameScene, Audio, Storage)
├── README.md           # Project documentation and configuration guide
├── assets/             # Local graphical game assets
│   ├── bird.png        # 17x12 pixel-art bird sprite
│   ├── background.png  # 900x504 pixel-art city skyline background
│   ├── ground.png      # 932x66 pixel-art road/ground surface
│   ├── pipe.png        # 32x500 pixel-art green obstacle pipe
│   ├── road.png        # Alias copy for tutorial compatibility
│   ├── column.png      # Alias copy for tutorial compatibility
│   └── README.md       # Asset inventory and customization guide
└── flappy-bird/        # Synchronized mirror directory for backward compatibility
```

---

## How to Run the Game Locally

Because modern web browsers enforce security policies (CORS) when loading local images through the `file://` protocol, run a local development server.

### Option 1: Python 3 (Pre-installed on macOS/Linux)
From the workspace root directory:
```bash
python3 -m http.server 8080
```
Then navigate to:
```text
http://localhost:8080/
```

### Option 2: Node.js / npx
```bash
npx serve .
# or
npx http-server -p 8080
```

---

## Player Controls Reference

| Action | Desktop Keyboard | Mouse | Touch / Mobile / iPad |
|--------|------------------|-------|-----------------------|
| **Flap / Jump** | <kbd>Spacebar</kbd> or <kbd>↑ Arrow</kbd> | Left-Click on canvas | Tap anywhere on screen |
| **Start Game** | <kbd>Spacebar</kbd> or <kbd>↑ Arrow</kbd> | Click canvas | Tap canvas |
| **Pause / Resume** | <kbd>P</kbd> or Pause icon | Click Pause icon | Tap Pause icon |
| **Toggle Sound** | — | Click Sound icon | Tap Sound icon |
| **Restart Game** | <kbd>Spacebar</kbd> (after death) | Click "Play Again" or Reset icon | Tap "Play Again" or Reset icon |

---

## Main Game Configuration Values

All gameplay tuning parameters are centralized in `CONFIG` at the top of [app.js](file:///Users/chaitanyaram/Flappy%20Bird%20Clone%20with%20Phaser/app.js#L12-L32):

```javascript
const CONFIG = {
  WIDTH: 400,              // Game virtual width in pixels
  HEIGHT: 600,             // Game virtual height in pixels
  GRAVITY: 920,            // Downward acceleration (px/s^2)
  FLAP_VELOCITY: -310,     // Upward impulse on flap
  TERMINAL_VELOCITY: 480,  // Maximum downward fall speed
  PIPE_SPEED: -160,        // Horizontal obstacle scrolling speed
  PIPE_SPAWN_INTERVAL: 1650,// Milliseconds between pipe pairs
  PIPE_GAP: 145,           // Vertical gap clearance
  PIPE_MIN_Y: 130,         // Minimum gap center height
  PIPE_MAX_Y: 380,         // Maximum gap center height
  GROUND_HEIGHT: 64,       // Height of bottom platform
  BIRD_START_X: 100,       // Bird initial X coordinate
  BIRD_START_Y: 270,       // Bird initial Y coordinate
};
```

---

## Responsive Viewport Behavior

- **Dynamic Viewport Height (`100dvh`)**: Automatically accommodates mobile browser address bars and notches.
- **Fixed Aspect Ratio (`2:3`)**: Scales the canvas with pixel sharpness (`image-rendering: pixelated`) without stretching or distortion.
- **No Overflow**: `overflow: hidden; touch-action: none;` prevents bounce-scroll, pull-to-refresh, and unwanted gestures.
- **Touch Targets**: All toolbar buttons are sized to at least `42×42px` on touch screens for easy finger interaction.
