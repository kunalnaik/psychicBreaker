class loadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'load' });
  }

  preload() {
    const requiredAssets = ['ball', 'paddle', 'brick'];
    const failedFiles = [];
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const barW = Math.min(300, this.scale.width - 120);

    this.add.text(cx, cy - 20, 'LOADING...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffee00',
      stroke: '#aa6600',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.rectangle(cx, cy + 20, barW, 16, 0x1a1a3a).setOrigin(0.5);
    const bar = this.add.rectangle(cx - barW / 2, cy + 20, 0, 10, 0x00ffff).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      bar.width = barW * value;
    });

    this.load.on('loaderror', (file) => {
      failedFiles.push({ key: file.key, src: file.src || file.url || 'unknown path' });
    });

    this.load.image('ball', 'assets/ball.png');
    this.load.image('paddle', 'assets/paddle.png');
    this.load.image('brick', 'assets/brick.png');

    this.load.once('complete', () => {
      const missingAssets = requiredAssets.filter((key) => !this.textures.exists(key));
      if (failedFiles.length > 0 || missingAssets.length > 0) {
        const details = failedFiles.map((file) => `${file.key}: ${file.src}`);
        if (missingAssets.length > 0) {
          details.push(`Missing textures: ${missingAssets.join(', ')}`);
        }

        const panelW = this.scale.width - 20;
        this.add.rectangle(cx, cy + 85, panelW, 145, 0x220000, 0.75).setOrigin(0.5);
        this.add.text(cx, cy + 45, 'ASSET LOAD FAILED', {
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          fill: '#ff6666',
          stroke: '#770000',
          strokeThickness: 2,
          align: 'center',
          wordWrap: { width: panelW - 20 }
        }).setOrigin(0.5);

        this.add.text(cx, cy + 92, details.join('\n'), {
          fontFamily: 'monospace',
          fontSize: '11px',
          fill: '#ffd0d0',
          align: 'center',
          wordWrap: { width: panelW - 20 }
        }).setOrigin(0.5);

        this.add.text(cx, cy + 150, 'Run from a local server (npm start), not file://', {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          fill: '#ffee00',
          align: 'center'
        }).setOrigin(0.5);
        return;
      }

      if (GAME_MODE === 'psychic') {
        this.scene.start('train');
      } else {
        this.scene.start('play');
      }
    });
  }
}
