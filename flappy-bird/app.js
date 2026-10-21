/**
 * ============================================================================
 * Flappy Bird - Production-Ready Phaser 3 Game
 * ============================================================================
 */

'use strict';

/**
 * Central Gameplay Configuration
 */
const CONFIG = {
  // Game virtual resolution (2:3 portrait aspect ratio)
  WIDTH: 400,
  HEIGHT: 600,

  // Physics tuning
  GRAVITY: 920,             // Downward acceleration (px/s^2)
  FLAP_VELOCITY: -310,      // Upward flap impulse speed
  TERMINAL_VELOCITY: 480,   // Maximum fall speed

  // Obstacle generation
  PIPE_SPEED: -160,         // Horizontal speed (px/s)
  PIPE_SPAWN_INTERVAL: 1650,// Time in ms between obstacle pairs
  PIPE_GAP: 145,            // Vertical clearance gap opening
  PIPE_MIN_Y: 130,          // Minimum gap center Y
  PIPE_MAX_Y: 380,          // Maximum gap center Y

  // Layout geometry
  GROUND_HEIGHT: 64,        // Height of bottom platform
  BIRD_START_X: 100,        // Starting X coordinate of the bird
  BIRD_START_Y: 270,        // Starting Y coordinate of the bird
};

/**
 * AudioManager: Built-in Web Audio API sound synthesizer.
 * Generates retro 8-bit sound effects directly in code to avoid missing audio
 * files, slow network downloads, or browser CORS restrictions.
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;

    try {
      this.isMuted = localStorage.getItem('flappy_muted') === 'true';
    } catch (e) {
      this.isMuted = false;
    }
  }

  // AudioContext must be initialized on a user gesture (tap/click/key)
  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('flappy_muted', String(this.isMuted));
    } catch (e) {}
    return this.isMuted;
  }

  // Rising chirp for bird flap
  playFlap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.11);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Two-tone cheerful bell chime for passing a pipe
  playScore() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  // Low punchy thud for collision impact
  playHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Swoosh transition sound
  playSwoosh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }
}

const Audio = new AudioManager();

/**
 * StorageManager: Safely persists and loads high scores from localStorage.
 */
const StorageManager = {
  getBestScore() {
    try {
      const val = localStorage.getItem('flappy_best_score');
      return val ? parseInt(val, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  },
  saveBestScore(score) {
    try {
      const current = this.getBestScore();
      if (score > current) {
        localStorage.setItem('flappy_best_score', String(score));
        return true;
      }
    } catch (e) {}
    return false;
  }
};

/**
 * ----------------------------------------------------------------------------
 * BootScene: Preloads graphical assets with procedural fallbacks.
 * ----------------------------------------------------------------------------
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.image('bird', 'assets/bird.png');
    this.load.image('background', 'assets/background.png');
    this.load.image('ground', 'assets/ground.png');
    this.load.image('pipe', 'assets/pipe.png');

    // Procedural fallback if an image is missing
    this.load.on('loaderror', (fileObj) => {
      this.generateFallbackTexture(fileObj.key);
    });
  }

  create() {
    this.scene.start('GameScene');
  }

  generateFallbackTexture(key) {
    const g = this.make.graphics();
    if (key === 'bird') {
      g.fillStyle(0xf7d038, 1);
      g.fillRoundedRect(0, 0, 24, 18, 4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(18, 6, 4);
      g.fillStyle(0x000000, 1);
      g.fillCircle(19, 6, 2);
      g.fillStyle(0xe8612c, 1);
      g.fillTriangle(16, 10, 24, 12, 16, 15);
      g.generateTexture('bird', 24, 18);
    } else if (key === 'pipe') {
      g.fillStyle(0x5cb85c, 1);
      g.fillRect(0, 0, 48, 500);
      g.fillStyle(0x4cae4c, 1);
      g.fillRect(0, 0, 10, 500);
      g.fillStyle(0x449d44, 1);
      g.fillRect(0, 0, 52, 28);
      g.generateTexture('pipe', 52, 500);
    } else if (key === 'ground') {
      g.fillStyle(0xd5ba80, 1);
      g.fillRect(0, 0, 400, 64);
      g.fillStyle(0x61a030, 1);
      g.fillRect(0, 0, 400, 12);
      g.generateTexture('ground', 400, 64);
    } else if (key === 'background') {
      g.fillStyle(0x4ec0ca, 1);
      g.fillRect(0, 0, 400, 600);
      g.generateTexture('background', 400, 600);
    }
    g.destroy();
  }
}

/**
 * ----------------------------------------------------------------------------
 * GameScene: Core Flappy Bird gameplay and state machine.
 * ----------------------------------------------------------------------------
 */
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.gameState = 'READY'; // States: 'READY', 'PLAYING', 'GAMEOVER', 'PAUSED'
    this.score = 0;
    this.bestScore = StorageManager.getBestScore();
    this.isPaused = false;
    this.canRestart = false;

    // 1. Scenery
    this.createBackground();
    this.pipes = this.physics.add.group();
    this.createGround();

    // 2. Bird
    this.createBird();

    // 3. Collisions
    this.setupCollisions();

    // 4. Inputs
    this.setupInputs();

    // 5. User Interface (HUD, Start, Game Over, Pause)
    this.setupUI();

    // 6. Enter Ready State
    this.enterReadyState();
  }

  createBackground() {
    this.background = this.add.tileSprite(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT, 'background')
      .setOrigin(0, 0)
      .setDepth(0);

    const bgSource = this.textures.get('background').getSourceImage();
    if (bgSource && bgSource.height) {
      const scale = (CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT) / bgSource.height;
      this.background.setTileScale(scale, scale);
    }
  }

  createGround() {
    const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;

    this.ground = this.add.tileSprite(0, groundY, CONFIG.WIDTH, CONFIG.GROUND_HEIGHT, 'ground')
      .setOrigin(0, 0)
      .setDepth(20);

    this.groundPlatform = this.physics.add.staticGroup();
    const groundBody = this.groundPlatform.create(CONFIG.WIDTH / 2, groundY + CONFIG.GROUND_HEIGHT / 2);
    groundBody.setSize(CONFIG.WIDTH, CONFIG.GROUND_HEIGHT);
    groundBody.setVisible(false);
  }

  createBird() {
    this.bird = this.physics.add.sprite(CONFIG.BIRD_START_X, CONFIG.BIRD_START_Y, 'bird')
      .setDepth(15)
      .setScale(2.2);

    // Tuned hitbox for fair, responsive collision feel
    this.bird.body.setSize(14, 11);
    this.bird.body.setOffset(1.5, 0.5);
    this.bird.body.setAllowGravity(false);
  }

  setupCollisions() {
    this.physics.add.collider(this.bird, this.groundPlatform, () => {
      this.handleCollision('ground');
    });

    this.physics.add.overlap(this.bird, this.pipes, () => {
      this.handleCollision('pipe');
    });
  }

  setupInputs() {
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // Prevent default browser scrolling for Space and Up arrow
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
    ]);

    this.spaceKey.on('down', () => this.handleActionInput());
    this.upKey.on('down', () => this.handleActionInput());
    this.pKey.on('down', () => this.togglePause());

    // Canvas click and mobile touch
    this.input.on('pointerdown', (pointer) => {
      this.handleActionInput();
    });
  }

  handleActionInput() {
    if (this.isPaused) return;

    if (this.gameState === 'READY') {
      this.startGame();
    } else if (this.gameState === 'PLAYING') {
      this.flapBird();
    } else if (this.gameState === 'GAMEOVER') {
      if (this.canRestart) {
        this.restartGame();
      }
    }
  }

  enterReadyState() {
    this.gameState = 'READY';
    this.bird.setPosition(CONFIG.BIRD_START_X, CONFIG.BIRD_START_Y);
    this.bird.setVelocity(0, 0);
    this.bird.setAngle(0);
    this.bird.body.setAllowGravity(false);

    // Gentle hovering animation
    if (this.readyTween) {
      this.readyTween.stop();
    }
    this.readyTween = this.tweens.add({
      targets: this.bird,
      y: CONFIG.BIRD_START_Y - 12,
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.showReadyUI();
  }

  startGame() {
    if (this.gameState !== 'READY') return;

    this.gameState = 'PLAYING';

    if (this.readyTween) {
      this.readyTween.stop();
    }

    this.bird.body.setAllowGravity(true);
    this.bird.body.setGravityY(CONFIG.GRAVITY);
    this.flapBird();

    this.hideReadyUI();
    this.scoreText.setVisible(true);
    this.scoreText.setText('0');

    // Continuous obstacle spawning
    this.pipeTimer = this.time.addEvent({
      delay: CONFIG.PIPE_SPAWN_INTERVAL,
      callback: this.spawnPipePair,
      callbackScope: this,
      loop: true
    });

    Audio.playSwoosh();
  }

  flapBird() {
    if (this.gameState !== 'PLAYING') return;

    this.bird.setVelocityY(CONFIG.FLAP_VELOCITY);
    this.bird.setAngle(-24);
    Audio.playFlap();
  }

  spawnPipePair() {
    if (this.gameState !== 'PLAYING') return;

    const spawnX = CONFIG.WIDTH + 45;
    const halfGap = CONFIG.PIPE_GAP / 2;
    const gapCenterY = Phaser.Math.Between(CONFIG.PIPE_MIN_Y, CONFIG.PIPE_MAX_Y);

    // --- TOP PIPE (Flipped upside down, descending from sky) ---
    const topPipe = this.pipes.create(spawnX, 0, 'pipe')
      .setFlipY(true)
      .setScale(1.65, 1.3)
      .setDepth(10);
    const pipeHalfH = topPipe.displayHeight / 2;
    topPipe.setY((gapCenterY - halfGap) - pipeHalfH);

    topPipe.body.allowGravity = false;
    topPipe.body.immovable = true;
    topPipe.body.velocity.x = CONFIG.PIPE_SPEED;
    topPipe.body.setSize(topPipe.width * 0.85, topPipe.height, true);

    // --- BOTTOM PIPE (Right side up, rising from ground) ---
    const bottomPipe = this.pipes.create(spawnX, 0, 'pipe')
      .setFlipY(false)
      .setScale(1.65, 1.3)
      .setDepth(10);
    bottomPipe.setY((gapCenterY + halfGap) + pipeHalfH);

    bottomPipe.body.allowGravity = false;
    bottomPipe.body.immovable = true;
    bottomPipe.body.velocity.x = CONFIG.PIPE_SPEED;
    bottomPipe.body.setSize(bottomPipe.width * 0.85, bottomPipe.height, true);

    // Scoring metadata
    topPipe.hasScored = false;
    bottomPipe.hasScored = true;
    topPipe.pair = bottomPipe;
  }

  update(time, delta) {
    if (this.gameState === 'READY') {
      this.ground.tilePositionX += 1.2;
      return;
    }

    if (this.gameState === 'PLAYING') {
      // Parallax scenery
      this.ground.tilePositionX += 2.67;
      this.background.tilePositionX += 0.45;

      // Dynamic tilt rotation
      if (this.bird.body.velocity.y < 0) {
        this.bird.angle = Phaser.Math.Clamp(this.bird.angle - 3.2, -24, 75);
      } else {
        this.bird.angle = Phaser.Math.Clamp(this.bird.angle + 3.0, -24, 75);
      }

      // Clamp terminal fall velocity
      if (this.bird.body.velocity.y > CONFIG.TERMINAL_VELOCITY) {
        this.bird.body.velocity.y = CONFIG.TERMINAL_VELOCITY;
      }

      // Ceiling boundary
      if (this.bird.y < 8) {
        this.bird.y = 8;
        this.bird.setVelocityY(0);
      }

      // Pipe scoring & off-screen cleanup
      this.pipes.getChildren().forEach((pipe) => {
        if (!pipe.hasScored && pipe.x < this.bird.x) {
          pipe.hasScored = true;
          this.incrementScore();
        }
        if (pipe.x < -80) {
          pipe.destroy();
        }
      });
    }

    if (this.gameState === 'GAMEOVER') {
      if (this.bird.angle < 90) {
        this.bird.angle += 8;
      }
    }
  }

  incrementScore() {
    this.score += 1;
    this.scoreText.setText(String(this.score));

    // Update and persist high score live
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      StorageManager.saveBestScore(this.score);
    }

    // Score counter bounce animation
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    Audio.playScore();
  }

  handleCollision(source) {
    if (this.gameState === 'GAMEOVER') return;

    this.gameState = 'GAMEOVER';
    this.canRestart = false;

    Audio.playHit();

    if (this.pipeTimer) {
      this.pipeTimer.destroy();
    }

    this.pipes.setVelocityX(0);
    this.bird.setVelocityX(0);
    this.bird.setTint(0xff5555);

    // Screen flash impact
    this.cameras.main.flash(180, 255, 255, 255);

    const isNewRecord = StorageManager.saveBestScore(this.score);
    this.bestScore = StorageManager.getBestScore();

    // Slide up scorecard after short delay
    this.time.delayedCall(400, () => {
      this.showGameOverUI(isNewRecord);
      // Debounce input to prevent accidental instant restart
      this.time.delayedCall(350, () => {
        this.canRestart = true;
      });
    });
  }

  togglePause() {
    if (this.gameState !== 'PLAYING' && !this.isPaused) return;

    if (!this.isPaused) {
      this.pauseGame();
    } else {
      this.resumeGame();
    }
  }

  pauseGame() {
    if (this.gameState !== 'PLAYING') return;
    this.isPaused = true;
    this.physics.pause();
    if (this.pipeTimer) {
      this.pipeTimer.paused = true;
    }
    this.pauseOverlay.setVisible(true);
    updateHtmlPauseState(true);
  }

  resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.physics.resume();
    if (this.pipeTimer) {
      this.pipeTimer.paused = false;
    }
    this.pauseOverlay.setVisible(false);
    updateHtmlPauseState(false);
  }

  restartGame() {
    if (this.pipeTimer) {
      this.pipeTimer.destroy();
    }

    this.pipes.clear(true, true);
    this.bird.clearTint();
    this.bird.setVelocity(0, 0);
    this.bird.setAngle(0);

    this.score = 0;
    this.scoreText.setText('0');
    this.scoreText.setVisible(false);
    this.isPaused = false;
    this.canRestart = false;

    this.gameOverContainer.setVisible(false);
    this.pauseOverlay.setVisible(false);

    this.enterReadyState();
  }

  // --------------------------------------------------------------------------
  // USER INTERFACE & ARCADE MENUS
  // --------------------------------------------------------------------------

  setupUI() {
    const centerX = CONFIG.WIDTH / 2;

    // In-game score HUD
    this.scoreText = this.add.text(centerX, 64, '0', {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(30).setVisible(false);

    // --- READY SCREEN ---
    this.readyContainer = this.add.container(centerX, 0).setDepth(30);

    const titleText = this.add.text(0, 155, 'FLAPPY BIRD', {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '28px',
      color: '#facc15',
      stroke: '#78350f',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5);

    const getReadyText = this.add.text(0, 215, 'GET READY!', {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#0f172a',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5);

    const tapPrompt = this.add.text(0, 395, 'TAP OR PRESS SPACE\nTO FLY', {
      fontFamily: '"Outfit", system-ui, sans-serif',
      fontSize: '17px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: tapPrompt,
      alpha: 0.35,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.readyBestText = this.add.text(0, 480, `BEST SCORE: ${this.bestScore}`, {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '11px',
      color: '#fde68a',
      stroke: '#451a03',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5);

    this.readyContainer.add([titleText, getReadyText, tapPrompt, this.readyBestText]);

    // --- GAME OVER SCORECARD ---
    this.gameOverContainer = this.add.container(centerX, 0).setDepth(40).setVisible(false);

    const gameOverBanner = this.add.text(0, 140, 'GAME OVER', {
      fontFamily: '"Press Start 2P", Courier, monospace',
      fontSize: '30px',
      color: '#ef4444',
      stroke: '#450a0a',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5);

    // Scorecard panel box (warm retro arcade styling)
    const cardBg = this.add.rectangle(0, 275, 290, 160, 0x1e293b, 0.95)
      .setStrokeStyle(3, 0xf59e0b)
      .setOrigin(0.5);

    // Medal Slot
    this.medalCircle = this.add.circle(-80, 275, 28, 0x334155)
      .setStrokeStyle(2, 0x64748b)
      .setOrigin(0.5);

    this.medalLabel = this.add.text(-80, 275, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      align: 'center',
    }).setOrigin(0.5);

    const medalTitle = this.add.text(-80, 235, 'MEDAL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    // Score breakdown labels
    const scoreTitle = this.add.text(50, 230, 'SCORE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    this.finalScoreText = this.add.text(50, 252, '0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const bestTitle = this.add.text(50, 285, 'BEST', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    this.bestScoreText = this.add.text(50, 307, '0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#facc15',
    }).setOrigin(0.5);

    // New record ribbon
    this.newRecordBadge = this.add.text(50, 332, 'NEW', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#ffffff',
      backgroundColor: '#ef4444',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setVisible(false);

    // Tactile Play Again Button
    const restartBtnBg = this.add.rectangle(0, 400, 170, 46, 0x16a34a)
      .setStrokeStyle(2, 0x86efac)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const restartBtnText = this.add.text(0, 400, 'PLAY AGAIN', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0.5);

    restartBtnBg.on('pointerover', () => restartBtnBg.setFillStyle(0x15803d));
    restartBtnBg.on('pointerout', () => restartBtnBg.setFillStyle(0x16a34a));
    restartBtnBg.on('pointerdown', (p, x, y, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      if (this.canRestart) this.restartGame();
    });

    this.gameOverContainer.add([
      gameOverBanner,
      cardBg,
      this.medalCircle,
      this.medalLabel,
      medalTitle,
      scoreTitle,
      this.finalScoreText,
      bestTitle,
      this.bestScoreText,
      this.newRecordBadge,
      restartBtnBg,
      restartBtnText,
    ]);

    // --- PAUSE OVERLAY ---
    this.pauseOverlay = this.add.container(centerX, CONFIG.HEIGHT / 2).setDepth(45).setVisible(false);

    const pauseDarken = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.7).setOrigin(0.5);

    const pauseTitle = this.add.text(0, -30, 'PAUSED', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: '#facc15',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const resumeBtnBg = this.add.rectangle(0, 45, 160, 42, 0x2563eb)
      .setStrokeStyle(2, 0x93c5fd)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const resumeBtnText = this.add.text(0, 45, 'RESUME', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);

    resumeBtnBg.on('pointerdown', (p, x, y, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      this.resumeGame();
    });

    this.pauseOverlay.add([pauseDarken, pauseTitle, resumeBtnBg, resumeBtnText]);
  }

  showReadyUI() {
    this.readyBestText.setText(`BEST SCORE: ${this.bestScore}`);
    this.readyContainer.setVisible(true);
    this.gameOverContainer.setVisible(false);
    this.scoreText.setVisible(false);
  }

  hideReadyUI() {
    this.readyContainer.setVisible(false);
  }

  showGameOverUI(isNewRecord) {
    this.finalScoreText.setText(String(this.score));
    this.bestScoreText.setText(String(this.bestScore));
    this.newRecordBadge.setVisible(isNewRecord || (this.score > 0 && this.score >= this.bestScore));

    // Award medals based on classic thresholds
    if (this.score >= 40) {
      this.medalCircle.setFillStyle(0xe2e8f0); // Platinum
      this.medalLabel.setText('💎');
    } else if (this.score >= 30) {
      this.medalCircle.setFillStyle(0xfacc15); // Gold
      this.medalLabel.setText('🥇');
    } else if (this.score >= 20) {
      this.medalCircle.setFillStyle(0x94a3b8); // Silver
      this.medalLabel.setText('🥈');
    } else if (this.score >= 10) {
      this.medalCircle.setFillStyle(0xd97706); // Bronze
      this.medalLabel.setText('🥉');
    } else {
      this.medalCircle.setFillStyle(0x1e293b);
      this.medalLabel.setText('');
    }

    this.gameOverContainer.setVisible(true);
    this.scoreText.setVisible(false);

    // Smooth pop-in animation
    this.gameOverContainer.setScale(0.88);
    this.gameOverContainer.setAlpha(0);
    this.tweens.add({
      targets: this.gameOverContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 220,
      ease: 'Back.easeOut'
    });
  }
}

/**
 * ----------------------------------------------------------------------------
 * Phaser Game Setup
 * ----------------------------------------------------------------------------
 */
const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene],
};

const game = new Phaser.Game(gameConfig);

/**
 * ----------------------------------------------------------------------------
 * HTML Top-Bar Controls Integration
 * ----------------------------------------------------------------------------
 */
function updateHtmlPauseState(isPaused) {
  const iconPause = document.querySelector('.icon-pause');
  const iconPlay = document.querySelector('.icon-play');
  if (iconPause && iconPlay) {
    iconPause.style.display = isPaused ? 'none' : 'block';
    iconPlay.style.display = isPaused ? 'block' : 'none';
  }
  const btn = document.getElementById('btn-pause');
  if (btn) {
    btn.setAttribute('aria-label', isPaused ? 'Resume Game' : 'Pause Game');
  }
}

function updateHtmlSoundState(isMuted) {
  const iconOn = document.querySelector('.icon-sound-on');
  const iconOff = document.querySelector('.icon-sound-off');
  if (iconOn && iconOff) {
    iconOn.style.display = isMuted ? 'none' : 'block';
    iconOff.style.display = isMuted ? 'block' : 'none';
  }
  const btn = document.getElementById('btn-mute');
  if (btn) {
    btn.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const btnPause = document.getElementById('btn-pause');
  const btnMute = document.getElementById('btn-mute');
  const btnRestart = document.getElementById('btn-restart');

  updateHtmlSoundState(Audio.isMuted);

  // Stop pointer events on buttons from reaching canvas
  [btnPause, btnMute, btnRestart].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  });

  if (btnPause) {
    btnPause.addEventListener('click', (e) => {
      e.stopPropagation();
      const scene = game.scene.getScene('GameScene');
      if (scene) scene.togglePause();
    });
  }

  if (btnMute) {
    btnMute.addEventListener('click', (e) => {
      e.stopPropagation();
      const muted = Audio.toggleMute();
      updateHtmlSoundState(muted);
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      const scene = game.scene.getScene('GameScene');
      if (scene) scene.restartGame();
    });
  }
});
