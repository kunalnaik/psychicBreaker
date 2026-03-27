class trainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'train' });
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const cx = width / 2;

    this.add.text(24, 26, 'Instructions:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      fill: '#ffffff'
    });

    this.add.text(24, height - 190, [
      'We need to train WebGazer to accurately track your eyes.',
      'For best results, please keep your face close to the camera.',
      'While looking at your cursor, please click on the blocks',
      'below in random order. Once done, press ENTER.'
    ].join('\n'), {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      fill: '#ffffff',
      lineSpacing: 6
    });

    const cols = 3;
    const rows = 3;
    const sideMargin = 24;
    const gap = 10;
    const btnW = Math.floor((width - sideMargin * 2 - gap * (cols - 1)) / cols);
    const btnH = 34;
    const gridTop = height - 105;

    for (let i = 0; i < 9; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = sideMargin + col * (btnW + gap);
      const by = gridTop + row * (btnH + 8);
      const btn = this.add.rectangle(bx + btnW / 2, by, btnW, btnH, 0x00ffff)
        .setStrokeStyle(2, 0x006688)
        .setInteractive({ useHandCursor: true });

      this.add.text(bx + btnW / 2, by, 'CLICK ME', {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        fill: '#0a0a1a'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => { btn.destroy(); });
    }

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('play');
    });
  }
}
