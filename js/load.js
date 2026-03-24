class loadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'load' });
  }

  preload() {
    this.add.text(400, 270, 'LOADING...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#ffee00',
      stroke: '#aa6600',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.rectangle(400, 310, 300, 16, 0x1a1a3a).setOrigin(0.5);
    const bar = this.add.rectangle(200, 310, 0, 10, 0x00ffff).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      bar.width = 300 * value;
    });

    this.load.image('ball', 'assets/ball.png');
    this.load.image('paddle', 'assets/paddle.png');
    this.load.image('brick', 'assets/brick.png');

    this.load.once('complete', () => {
      if (GAME_MODE === 'psychic') {
        this.scene.start('train');
      } else {
        this.scene.start('play');
      }
    });
  }
}
