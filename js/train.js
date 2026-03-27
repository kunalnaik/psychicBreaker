class trainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'train' });
    this.isComplete = false;
    this.centerButton = null;
    this.centerButtonLabel = null;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const cx = width / 2;

    if (typeof window.getPlayBounds === 'function') {
      this.playBounds = window.getPlayBounds(width, height);
    } else {
      this.playBounds = {
        x: Math.round(width * 0.005),
        y: Math.round(height * 0.075),
        width: width - Math.round(width * 0.005) * 2,
        height: height - Math.round(height * 0.075) - Math.round(height * 0.025)
      };
    }

    this.boundsGraphics = this.add.graphics();
    this.boundsGraphics.lineStyle(3, 0x4488ff, 0.8);
    this.boundsGraphics.strokeRect(
      this.playBounds.x,
      this.playBounds.y,
      this.playBounds.width,
      this.playBounds.height
    );

    const titleY = this.playBounds.y + this.playBounds.height * 0.32;
    this.instructionTitlePsychic = this.add.text(cx + 8, titleY, 'PSYCHIC', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fontStyle: 'italic',
      fill: '#b366ff'
    }).setOrigin(1, 0.5);

    this.instructionTitleSetup = this.add.text(cx + 24, titleY, 'SETUP', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);

    this.instructionsText = this.add.text(cx, this.playBounds.y + this.playBounds.height * 0.45, [
      '1) POSITION YOUR FACE IN THE CAMERA',
      '2) LOOK STRAIGHT AT THE CENTER OF THE SCREEN',
      '3) ONCE CENTERED, CLICK THE BUTTON BELOW'
    ].join('\n'), {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    this.trackerStatusText = this.add.text(cx, this.playBounds.y + this.playBounds.height * 0.6, 'TRACKER: INITIALIZING CAMERA...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      fill: '#88ffdd',
      align: 'center'
    }).setOrigin(0.5);

    // Move the button significantly higher, close to the status text
    const buttonY = this.playBounds.y + this.playBounds.height * 0.72;
    const buttonX = this.playBounds.x + this.playBounds.width / 2;

    this.centerButton = this.add.rectangle(buttonX, buttonY, 260, 34, 0x2a2a4a)
      .setStrokeStyle(2, 0x666688);

    this.centerButtonLabel = this.add.text(buttonX, buttonY, 'SET CENTER & BEGIN', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      fill: '#c0c0d8'
    }).setOrigin(0.5);

    this.trackerStatusPoll = this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        if (this.isComplete) return;

        const currentTrackerState = window.psychicTrackerState || {};

        if (!currentTrackerState.beginCalled && !currentTrackerState.initializing && typeof window.initPsychicTracker === 'function') {
          window.initPsychicTracker();
        }

        let hasFace = false;
        if (typeof window.webgazer !== 'undefined' && window.webgazer.getTracker) {
          const tracker = window.webgazer.getTracker();
          if (tracker && typeof tracker.getPositions === 'function') {
            const positions = tracker.getPositions();
            if (positions && positions.length > 0) {
              hasFace = true;
            }
          }
        }

        if (currentTrackerState.error) {
          this.trackerStatusText.setText('TRACKER: CAMERA ACCESS NEEDED');
          this.trackerStatusText.setColor('#ff8888');
        } else if (!currentTrackerState.webcamReady || currentTrackerState.initializing || !currentTrackerState.beginCalled) {
          this.trackerStatusText.setText('TRACKER: INITIALIZING CAMERA...');
          this.trackerStatusText.setColor('#88ffdd');
        } else if (!hasFace) {
          this.trackerStatusText.setText('TRACKER: LOOKING FOR FACE...');
          this.trackerStatusText.setColor('#ffee88');
          this.enableButton(false);
        } else {
          this.trackerStatusText.setText('TRACKER: FACE FOUND - READY');
          this.trackerStatusText.setColor('#66ff99');
          this.enableButton(true);
        }
      }
    });

    this.events.once('shutdown', () => {
      if (this.trackerStatusPoll) {
        this.trackerStatusPoll.remove(false);
      }
    });
  }

  enableButton(enabled) {
    if (enabled) {
      if (this.centerButton.fillColor !== 0x00ffff) {
        this.centerButton.setFillStyle(0x00ffff);
        this.centerButton.setStrokeStyle(2, 0x006688);
        this.centerButtonLabel.setColor('#0a0a1a');
      }
      
      if (!this.centerButton.getData('clickBound')) {
        this.centerButton.setData('clickBound', true);
        this.centerButton.setInteractive({ useHandCursor: true });
        this.centerButton.on('pointerdown', () => this.handleCenterClick());
      }
    } else {
      this.centerButton.disableInteractive();
      this.centerButton.setFillStyle(0x2a2a4a);
      this.centerButton.setStrokeStyle(2, 0x666688);
      this.centerButtonLabel.setColor('#c0c0d8');
    }
  }

  handleCenterClick() {
    if (this.isComplete) return;

    if (typeof window.webgazer !== 'undefined' && window.webgazer.getTracker) {
      const tracker = window.webgazer.getTracker();
      if (tracker && typeof tracker.getPositions === 'function') {
        const positions = tracker.getPositions();
        if (positions && positions.length > 0) {
          window.psychicBaselineHeadX = positions[1][0];
        }
      }
    }

    if (typeof window.psychicBaselineHeadX !== 'number') {
      window.psychicBaselineHeadX = 320; // safe fallback for a 640px feed
    }

    this.isComplete = true;
    this.trackerStatusText.setText('STARTING GAME...');
    this.trackerStatusText.setColor('#66ff99');
    
    this.centerButton.disableInteractive();
    this.centerButton.setFillStyle(0x2a2a4a);
    this.centerButton.setStrokeStyle(2, 0x1e8a4a);

    this.time.delayedCall(400, () => {
      this.scene.start('play');
    });
  }
}
