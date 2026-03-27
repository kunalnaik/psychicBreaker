class playScene extends Phaser.Scene {
  constructor() {
    super({ key: 'play' });
    this.score = 0;
    this.lives = 3;
    this.waitingForLaunch = true;
    this.paddleSpeed = 500;
    this.ballSpeed = 300;
    this.isPaused = false;
    this.pauseMenuItems = [];
    this.selectedPauseItem = 0;
    this.startupFailed = false;
    this.isLevelTransition = false;
    this.psychicGuideGraphics = null;
    this.psychicSmoothedPoint = null;
    this.lastPredictionPollAt = 0;
    this.psychicDebugText = null;
    this.lastPredictionSeenAt = 0;
    this.lastSeedTrainAt = 0;

    this.level = {
      name: 'LEVEL 1',
      subtitle: 'HEART',
      ballSpeed: 290,
      paddleSpeed: 500,
      paddleScale: 1,
      layout: [
        '01100110',
        '11111111',
        '11111111',
        '01111110',
        '00111100',
        '00011000'
      ]
    };
  }

  create() {
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    const requiredTextures = ['paddle', 'ball', 'brick'];
    const missingTextures = requiredTextures.filter((key) => !this.textures.exists(key));
    if (missingTextures.length > 0) {
      this.startupFailed = true;
      this.add.text(centerX, centerY - 45, 'CANNOT START GAME', {
        fontFamily: '"Press Start 2P"',
        fontSize: '14px',
        fill: '#ff4444',
        stroke: '#770000',
        strokeThickness: 3
      }).setOrigin(0.5);

      this.add.text(centerX, centerY, `Missing textures: ${missingTextures.join(', ')}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fill: '#ffd0d0'
      }).setOrigin(0.5);

      this.add.text(centerX, centerY + 35, 'Please run with npm start and reload.', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        fill: '#ffee00'
      }).setOrigin(0.5);
      return;
    }

    this.paddleY = gameHeight - 90;
    this.ballDockY = this.paddleY - 22;
    this.lossY = this.paddleY + 48;

    this.paddle = this.physics.add.sprite(centerX, this.paddleY, 'paddle');
    this.paddle.setImmovable(true);
    this.paddle.body.setSize(80, 14);
    this.paddle.body.setOffset(0, 1);

    if (typeof window.getPlayBounds === 'function') {
      this.playBounds = window.getPlayBounds(gameWidth, gameHeight);
    } else {
      const sideInsetRatio = 0.005;
      const topInsetRatio = 0.075;
      const bottomInsetRatio = 0.025;

      const sideInset = Math.round(gameWidth * sideInsetRatio);
      const topInset = Math.round(gameHeight * topInsetRatio);
      const bottomInset = Math.round(gameHeight * bottomInsetRatio);

      const width = gameWidth - sideInset * 2;
      const height = gameHeight - topInset - bottomInset;

      this.playBounds = {
        x: sideInset,
        y: topInset,
        width,
        height
      };
    }

    this.ball = this.physics.add.sprite(centerX, this.ballDockY, 'ball');
    this.ball.setBounce(1);
    this.ball.body.setSize(14, 14);
    this.ball.body.setOffset(1, 1);
    this.ball.setCollideWorldBounds(true);
    this.physics.world.setBounds(
      this.playBounds.x,
      this.playBounds.y,
      this.playBounds.width,
      this.playBounds.height
    );

    this.bricks = this.physics.add.group();

    this.physics.add.collider(this.ball, this.paddle, this.paddleHit, null, this);
    this.physics.add.collider(this.ball, this.bricks, this.brickHit, null, this);

    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escWasDown = false;

    // Draw border walls to show playable area boundaries
    const graphics = this.add.graphics();
    graphics.lineStyle(3, 0x4488ff, 0.8);
    graphics.strokeRect(
      this.playBounds.x,
      this.playBounds.y,
      this.playBounds.width,
      this.playBounds.height
    );

    this.initUI();

    if (GAME_MODE === 'psychic') {
      this.psychicGuideGraphics = this.add.graphics().setDepth(25);
// Debug text removed to clean up the UI

      if (window.psychicLastCalibrationPointGame) {
        this.psychicSmoothedPoint = {
          x: window.psychicLastCalibrationPointGame.x,
          y: window.psychicLastCalibrationPointGame.y
        };
      }

      if (typeof window.initPsychicTracker === 'function') {
        window.initPsychicTracker();
      }
      if (typeof window.webgazer !== 'undefined' && typeof window.webgazer.resume === 'function') {
        window.webgazer.resume();
      }
    }

    this.setupLevel();

    this.events.once('shutdown', () => {
      if (this.psychicGuideGraphics) {
        this.psychicGuideGraphics.destroy();
      }
      if (this.psychicDebugText) {
        this.psychicDebugText.destroy();
      }
    });
  }

  initUI() {
    const gameWidth = this.scale.width;
    const centerX = gameWidth / 2;

    this.scoreText = this.add.text(15, 15, 'SCORE ' + this.score, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffee00',
      stroke: '#aa6600',
      strokeThickness: 2
    });

    this.livesText = this.add.text(gameWidth - 15, 15, 'LIVES ' + this.lives, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ff4444',
      stroke: '#880000',
      strokeThickness: 2
    }).setOrigin(1, 0);

    const modeText = GAME_MODE === 'psychic' ? 'PSYCHIC' : 'KEYBOARD';
    this.add.text(centerX, 15, modeText, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#00ffff',
      stroke: '#004466',
      strokeThickness: 1
    }).setOrigin(0.5, 0);

    this.levelText = this.add.text(centerX, 31, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#88ffdd',
      stroke: '#006655',
      strokeThickness: 1
    }).setOrigin(0.5, 0);

    this.launchPrompt = this.add.text(centerX, this.scale.height - 15, 'PRESS SPACE TO LAUNCH', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    }).setOrigin(0.5, 1);

    this.tweens.add({
      targets: this.launchPrompt,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Linear'
    });
  }

  showPauseMenu() {
    if (this.isLevelTransition) return;
    this.isPaused = true;
    this.physics.world.pause();

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.pauseOverlay = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.7).setDepth(10);

    this.pauseMenuContainer = this.add.container(cx, cy).setDepth(11);
    this.pauseMenuItems = [];

    this.pauseMenuContainer.add(
      this.add.text(0, -70, 'PAUSED', {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        fill: '#ffee00',
        stroke: '#aa6600',
        strokeThickness: 3
      }).setOrigin(0.5)
    );

    const makeBtn = (label, y, action) => {
      const btn = this.add.container(0, y);

      const bg = this.add.rectangle(0, 0, 220, 44, 0x1a1a3a)
        .setStrokeStyle(2, 0x00ffff);

      const txt = this.add.text(0, 0, label, {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        fill: '#00ffff'
      }).setOrigin(0.5);

      btn.add([bg, txt]);
      btn.setSize(220, 44);
      btn.setInteractive({ useHandCursor: true });

      btn.on('pointerdown', action);

      this.pauseMenuContainer.add(btn);
      this.pauseMenuItems.push({ btn, bg, txt, label });
      return btn;
    };

    makeBtn('RESUME', 0, () => this.hidePauseMenu());
    makeBtn('QUIT', 60, () => this.quitToMain());

    this.selectedPauseItem = 0;
    this.updatePauseMenuHighlight();

    this.input.keyboard.removeAllListeners('keydown');

    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Escape' && this.isPaused) {
        this.hidePauseMenu();
        return;
      }
      if (!this.isPaused) return;

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        this.selectedPauseItem = (this.selectedPauseItem + 1) % this.pauseMenuItems.length;
        this.updatePauseMenuHighlight();
      } else if (event.key === 'Enter') {
        const item = this.pauseMenuItems[this.selectedPauseItem];
        if (item) {
          item.btn.emit('pointerdown');
        }
      }
    });
  }

  updatePauseMenuHighlight() {
    this.pauseMenuItems.forEach((item, i) => {
      if (i === this.selectedPauseItem) {
        item.bg.setFillStyle(0x00ffff);
        item.txt.setFill('#0a0a1a');
        item.bg.setStrokeStyle(2, 0x00ffff);
      } else {
        item.bg.setFillStyle(0x1a1a3a);
        item.txt.setFill('#00ffff');
        item.bg.setStrokeStyle(2, 0x00ffff);
      }
    });
  }

  hidePauseMenu() {
    this.isPaused = false;
    this.physics.world.resume();

    if (this.pauseMenuContainer) {
      this.pauseMenuContainer.destroy();
      this.pauseMenuContainer = null;
    }
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
    this.pauseMenuItems = [];

    this.input.keyboard.removeAllListeners('keydown');
  }

  quitToMain() {
    if (GAME_MODE === 'psychic' && typeof window.shutdownPsychicTracker === 'function') {
      window.shutdownPsychicTracker();
    }

    setTimeout(() => {
      location.reload();
    }, 100);
  }

  initBricks(layout) {
    const brickColors = [
      0xff2222, 0xff6622, 0xff9922, 0xffcc22,
      0xccff22, 0x66ff22, 0x22ff66, 0x22ffaa,
      0x22ccff, 0x2266ff, 0x6622ff, 0xcc22ff
    ];

    const brickW = 46;
    const brickH = 20;
    const padding = 6;
    const rows = layout.length;
    const cols = Math.max(...layout.map((row) => row.length));
    const totalW = cols * (brickW + padding) - padding;
    const totalH = rows * brickH + (rows - 1) * padding;
    const offsetX = (this.scale.width - totalW) / 2;
    const playTop = this.playBounds ? this.playBounds.y : 0;
    const playHeight = this.playBounds ? this.playBounds.height : this.scale.height;
    const preferredTop = Math.max(96, Math.round(playTop + playHeight * 0.15));
    const bottomGap = 16;
    const maxTop = this.paddleY - bottomGap - totalH;
    const offsetY = Math.max(0, Math.min(preferredTop, maxTop));

    for (let r = 0; r < rows; r++) {
      const row = layout[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== '1') continue;
        const bx = offsetX + c * (brickW + padding) + brickW / 2;
        const by = offsetY + r * (brickH + padding) + brickH / 2;

        const brick = this.bricks.create(bx, by, 'brick');
        brick.setTint(brickColors[r % brickColors.length]);
        brick.body.setSize(brickW, brickH);
        brick.setImmovable(true);
      }
    }
  }

  setupLevel() {
    const level = this.level;
    this.ballSpeed = level.ballSpeed;
    this.paddleSpeed = level.paddleSpeed;

    this.bricks.clear(true, true);
    this.initBricks(level.layout);

    this.paddle.setScale(level.paddleScale, 1);
    this.paddle.body.setSize(this.paddle.displayWidth, 14);
    this.paddle.body.setOffset(0, 1);

    this.waitingForLaunch = true;
    this.ball.body.stop();
    this.paddle.x = this.scale.width / 2;
    this.ball.x = this.paddle.x;
    this.ball.y = this.ballDockY;

    this.levelText.setText(`${level.name} • ${level.subtitle}`);
    if (this.launchPrompt) this.launchPrompt.setVisible(true);
    this.showLevelIntro(level.name, level.subtitle);
  }

  showLevelIntro(name, subtitle) {
    this.isLevelTransition = true;
    this.physics.world.pause();

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const banner = this.add.container(cx, cy).setDepth(20);
    const panel = this.add.rectangle(0, 0, Math.min(520, this.scale.width - 40), 120, 0x000000, 0.75).setStrokeStyle(2, 0x00ffff);
    const title = this.add.text(0, -18, name, {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffee00'
    }).setOrigin(0.5);
    const sub = this.add.text(0, 20, subtitle, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#88ffdd'
    }).setOrigin(0.5);

    banner.add([panel, title, sub]);

    this.time.delayedCall(900, () => {
      banner.destroy();
      this.physics.world.resume();
      this.isLevelTransition = false;
    });
  }

  update() {
    if (this.startupFailed) return;
    if (this.isLevelTransition) return;
    if (this.isPaused) return;

    if (this.escKey.isDown && !this._escWasDown) {
      this._escWasDown = true;
      this.showPauseMenu();
      return;
    }
    if (!this.escKey.isDown) {
      this._escWasDown = false;
    }

    if (GAME_MODE === 'keyboard') {
      this.handleKeyboardInput();
    } else if (GAME_MODE === 'psychic') {
      this.handlePsychicInput();
    }

    if (this.waitingForLaunch) {
      this.ball.x = this.paddle.x;
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.launchBall();
      }
    } else if (this.ball.y > this.lossY) {
      this.ballLost();
    }
  }

  handleKeyboardInput() {
    if (this.leftKey.isDown) {
      this.paddle.x -= this.paddleSpeed * (1 / 60);
    } else if (this.rightKey.isDown) {
      this.paddle.x += this.paddleSpeed * (1 / 60);
    }
    this.clampPaddle();
  }

  handlePsychicInput() {
    const trackerState = window.psychicTrackerState || {};
    if (trackerState.error) {
      if (this.psychicGuideGraphics) {
        this.psychicGuideGraphics.clear();
      }
      this.clampPaddle();
      return;
    }

    this.pollCurrentPrediction();

    const prediction = trackerState.prediction;
    if (!prediction || typeof prediction.x !== 'number') {
      if (this.psychicGuideGraphics) this.psychicGuideGraphics.clear();
      this.clampPaddle();
      return;
    }

    const canvasRect = this.game.canvas.getBoundingClientRect();
    const fallbackViewportY = canvasRect.top + canvasRect.height * 0.85;
    
    // Lock Y to the paddle row for purely 1D (horizontal) tracking
    const mappedPoint = this.viewportToGamePoint(
      prediction.x,
      fallbackViewportY
    );

    if (mappedPoint) {
      if (!this.psychicSmoothedPoint) {
        this.psychicSmoothedPoint = { x: mappedPoint.x, y: mappedPoint.y };
      } else {
        // Linear, predictable smoothing for a natural feel without acceleration stutter
        const alpha = 0.2; 
        
        this.psychicSmoothedPoint.x += (mappedPoint.x - this.psychicSmoothedPoint.x) * alpha;
        this.psychicSmoothedPoint.y += (mappedPoint.y - this.psychicSmoothedPoint.y) * alpha;
      }

      this.paddle.x = this.psychicSmoothedPoint.x;
      this.renderPsychicGuide(this.psychicSmoothedPoint);
      this.lastPredictionSeenAt = performance.now();
    }

// Debug text rendering removed

    this.clampPaddle();
  }

  pollCurrentPrediction() {
    const now = performance.now();
    if (now - this.lastPredictionPollAt < 30) {
      return;
    }
    this.lastPredictionPollAt = now;

    if (typeof window.webgazer === 'undefined' || !window.webgazer.getTracker) {
      return;
    }
    
    const tracker = window.webgazer.getTracker();
    if (!tracker || typeof tracker.getPositions !== 'function') {
      return;
    }

    const positions = tracker.getPositions();
    if (!positions || positions.length === 0) {
      return;
    }

    const rawNoseX = positions[1][0];
    
    // Primary filter: Camera Deadzone to kill pure noise
    if (!window.psychicSmoothedNoseX) {
      window.psychicSmoothedNoseX = rawNoseX;
    } else {
      // If the camera only flickered by ~1.5 pixels, it's just noise. Ignore it.
      // If it's a real head movement (> 1.5 pixels), track it quickly.
      if (Math.abs(rawNoseX - window.psychicSmoothedNoseX) > 1.5) {
        window.psychicSmoothedNoseX += (rawNoseX - window.psychicSmoothedNoseX) * 0.4;
      }
    }

    const noseX = window.psychicSmoothedNoseX;
    const baselineX = typeof window.psychicBaselineHeadX === 'number' ? window.psychicBaselineHeadX : 320;
    
    const deltaX = noseX - baselineX;
    
    // Sensitivity map: 80 webcam pixels = half the screen width.
    const sensitivity = (this.scale.width / 2) / 80; 
    let targetX = (this.scale.width / 2) - (deltaX * sensitivity);

    const canvasRect = this.game.canvas.getBoundingClientRect();
    const mockViewportX = (targetX / this.scale.width) * canvasRect.width + canvasRect.left;

    const trackerState = window.psychicTrackerState || {};
    trackerState.ready = true;
    trackerState.hasPrediction = true;
    trackerState.prediction = {
      x: mockViewportX,
      y: canvasRect.top + canvasRect.height * 0.85,
      timestamp: Date.now()
    };
  }

  renderPsychicGuide(predictionPoint) {
    if (this.psychicGuideGraphics) {
      this.psychicGuideGraphics.clear();
    }
    // Red guideline drawing intentionally disabled to make the paddle movement feel more "psychic" and magical.
  }

  viewportToGamePoint(viewportX, viewportY) {
    if (typeof viewportX !== 'number' || typeof viewportY !== 'number') return null;

    const canvasRect = this.game.canvas.getBoundingClientRect();
    if (!canvasRect || canvasRect.width === 0 || canvasRect.height === 0) return null;

    const normalizedX = (viewportX - canvasRect.left) / canvasRect.width;
    const normalizedY = (viewportY - canvasRect.top) / canvasRect.height;

    return {
      x: Phaser.Math.Clamp(normalizedX, 0, 1) * this.scale.width,
      y: Phaser.Math.Clamp(normalizedY, 0, 1) * this.scale.height
    };
  }

  getWebcamAnchorInGameSpace() {
    const webcamElement = document.getElementById('webgazerVideoFeed');
    if (!webcamElement) {
      return {
        x: this.playBounds.x + 70,
        y: this.playBounds.y + 70
      };
    }

    const webcamRect = webcamElement.getBoundingClientRect();
    return this.viewportToGamePoint(
      webcamRect.left + webcamRect.width / 2,
      webcamRect.top + webcamRect.height / 2
    );
  }

  clampPaddle() {
    const hw = this.paddle.displayWidth / 2;
    if (this.paddle.x < hw) this.paddle.x = hw;
    else if (this.paddle.x > this.scale.width - hw) this.paddle.x = this.scale.width - hw;
  }

  launchBall() {
    this.waitingForLaunch = false;
    if (this.launchPrompt) this.launchPrompt.setVisible(false);
    const angle = Phaser.Math.DegToRad(-90 + (Math.random() * 40 - 20));
    this.ball.body.setVelocity(
      Math.cos(angle) * this.ballSpeed,
      Math.sin(angle) * this.ballSpeed
    );
  }

  paddleHit(ball, paddle) {
    const hitPoint = (ball.x - paddle.x) / (paddle.displayWidth / 2);
    const angle = Phaser.Math.DegToRad(hitPoint * 60 - 90);
    const speed = ball.body.velocity.length();
    ball.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  brickHit(ball, brick) {
    brick.destroy();
    this.score += 10;
    this.scoreText.setText('SCORE ' + this.score);

    if (this.bricks.countActive() === 0) {
      this.levelComplete();
    }
  }

  ballLost() {
    this.lives--;
    this.livesText.setText('LIVES ' + this.lives);

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.waitingForLaunch = true;
      this.ball.body.stop();
      this.ball.x = this.paddle.x;
      this.ball.y = this.ballDockY;
      if (this.launchPrompt) this.launchPrompt.setVisible(true);
    }
  }

  gameOver() {
    this.physics.world.pause();
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.text(cx, cy - 40, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      fill: '#ff2222',
      stroke: '#880000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(cx, cy + 6, 'SCORE ' + this.score, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffee00'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 42, 'RELOADING...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#888888'
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => { location.reload(); });
  }

  levelComplete() {
    this.isLevelTransition = true;
    this.physics.world.pause();
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const panel = this.add.container(cx, cy + 20).setDepth(20);
    const bg = this.add.rectangle(0, 0, Math.min(560, this.scale.width - 30), 170, 0x001a0a, 0.8).setStrokeStyle(2, 0x00ff66);
    const titleText = this.add.text(0, -45, 'DEMO COMPLETE!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
      fill: '#00ff66',
      stroke: '#006622',
      strokeThickness: 3
    }).setOrigin(0.5);
    const scoreText = this.add.text(0, 5, 'SCORE ' + this.score, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffee00'
    }).setOrigin(0.5);
    const subText = this.add.text(0, 45, 'Great run.', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#88ffdd'
    }).setOrigin(0.5);

    panel.add([bg, titleText, scoreText, subText]);
    this.time.delayedCall(2000, () => { location.reload(); });
  }
}
