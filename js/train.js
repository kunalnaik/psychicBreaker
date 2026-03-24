class trainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'train' });
  }

  create() {
    this.add.text(50, 50, 'Instructions:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffffff'
    });

    this.add.text(40, this.sys.game.config.height - 220, [
      'We need to train WebGazer to accurately track your eyes.',
      'For best results, please keep your face close to the camera.',
      'While looking at your cursor, please click on the blocks',
      'below in random order. Once done, press ENTER.'
    ].join('\n'), {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff',
      lineSpacing: 8
    });

    for (let i = 0; i < 9; i++) {
      const bx = 10 + (i % 3) * 260;
      const by = this.sys.game.config.height - 120 + Math.floor(i / 3) * 50;
      const btn = this.add.rectangle(bx + 120, by, 240, 40, 0x00ffff)
        .setStrokeStyle(2, 0x006688)
        .setInteractive({ useHandCursor: true });

      this.add.text(bx + 120, by, 'CLICK ME', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        fill: '#0a0a1a'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => { btn.destroy(); });
    }

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('play');
    });
  }
}
