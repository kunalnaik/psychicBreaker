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
  }

  create() {
    this.paddle = this.physics.add.sprite(400, 560, 'paddle');
    this.paddle.setImmovable(true);
    this.paddle.body.setSize(80, 14);
    this.paddle.body.setOffset(0, 1);

    this.ball = this.physics.add.sprite(400, 538, 'ball');
    this.ball.setBounce(1);
    this.ball.body.setSize(14, 14);
    this.ball.body.setOffset(1, 1);
    this.ball.setCollideWorldBounds(true);

    this.bricks = this.physics.add.group();
    this.initBricks();

    this.physics.add.collider(this.ball, this.paddle, this.paddleHit, null, this);
    this.physics.add.collider(this.ball, this.bricks, this.brickHit, null, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escWasDown = false;

    this.input.keyboard.on('keydown', this._keyHandler, this);

    this.initUI();

    this.waitingForLaunch = true;
  }

  initUI() {
    this.scoreText = this.add.text(15, 15, 'SCORE ' + this.score, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffee00',
      stroke: '#aa6600',
      strokeThickness: 2
    });

    this.livesText = this.add.text(785, 15, 'LIVES ' + this.lives, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ff4444',
      stroke: '#880000',
      strokeThickness: 2
    }).setOrigin(1, 0);

    const modeText = GAME_MODE === 'psychic' ? 'PSYCHIC' : 'KEYBOARD';
    this.add.text(400, 15, modeText, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#00ffff',
      stroke: '#004466',
      strokeThickness: 1
    }).setOrigin(0.5, 0);

    this.launchPrompt = this.add.text(400, 585, 'PRESS SPACE TO LAUNCH', {
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
    this.isPaused = true;
    this.physics.world.pause();

    const cx = this.sys.game.config.width / 2;
    const cy = this.sys.game.config.height / 2;

    this.pauseOverlay = this.add.rectangle(cx, cy, 800, 600, 0x000000, 0.7).setDepth(10);

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
    this.input.keyboard.on('keydown', this._keyHandler, this);
  }

  quitToMain() {
    if (window.game) {
      window.game.destroy(true);
      window.game = null;
    }
    document.getElementById('mode-select').style.display = 'flex';
  }

  _keyHandler(event) {
    if (event.key === 'Escape') {
      this.showPauseMenu();
    }
  }

  initBricks() {
    const brickColors = [
      0xff2222, 0xff6622, 0xff9922, 0xffcc22,
      0xccff22, 0x66ff22, 0x22ff66, 0x22ffaa,
      0x22ccff, 0x2266ff, 0x6622ff, 0xcc22ff
    ];

    const brickW = 48;
    const brickH = 20;
    const padding = 4;
    const rows = 8;
    const cols = 13;
    const offsetX = (800 - (cols * (brickW + padding) - padding)) / 2;
    const offsetY = 60;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = offsetX + c * (brickW + padding) + brickW / 2;
        const by = offsetY + r * (brickH + padding) + brickH / 2;

        const brick = this.bricks.create(bx, by, 'brick');
        brick.setTint(brickColors[r]);
        brick.body.setSize(brickW, brickH);
        brick.setImmovable(true);
      }
    }
  }

  update() {
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
      if (this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))) {
        this.launchBall();
      }
    } else if (this.ball.y > this.sys.game.config.height) {
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
    if (window.xprediction) {
      if (window.xprediction >= 0 && window.xprediction <= 800) {
        if (Math.abs(window.xprediction - window.prev_predict) < 5) {
          this.paddle.x = window.xprediction;
        }
      }
    }
    this.clampPaddle();
  }

  clampPaddle() {
    const hw = this.paddle.displayWidth / 2;
    if (this.paddle.x < hw) this.paddle.x = hw;
    else if (this.paddle.x > 800 - hw) this.paddle.x = 800 - hw;
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
      this.ball.y = 538;
      if (this.launchPrompt) this.launchPrompt.setVisible(true);
    }
  }

  gameOver() {
    this.physics.world.pause();

    this.add.text(400, 280, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '28px',
      fill: '#ff2222',
      stroke: '#880000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(400, 330, 'SCORE ' + this.score, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffee00'
    }).setOrigin(0.5);

    this.add.text(400, 370, 'RELOADING...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#888888'
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => { location.reload(); });
  }

  levelComplete() {
    this.physics.world.pause();

    this.add.text(400, 280, 'LEVEL CLEAR!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      fill: '#00ff66',
      stroke: '#006622',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(400, 330, 'SCORE ' + this.score, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffee00'
    }).setOrigin(0.5);

    this.add.text(400, 370, 'RELOADING...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#888888'
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => { location.reload(); });
  }
}
