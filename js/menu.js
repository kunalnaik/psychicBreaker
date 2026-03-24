class menuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'menu' });
  }

  create() {
    this.add.text(400, 150, 'BRICK BREAKER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '52px',
      fill: '#ffee00',
      stroke: '#ff6600',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(400, 230, 'PSYCHIC', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      fontStyle: 'italic',
      fill: '#cc44ff',
      stroke: '#6600aa',
      strokeThickness: 3
    }).setOrigin(0.5);

    const prompt = this.add.text(400, this.sys.game.config.height - 120, 'PRESS ENTER TO START', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Linear'
    });

    this.add.text(400, this.sys.game.config.height - 50, 'A CLASSIC ARCADE ADVENTURE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#334466'
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-ENTER', () => {
      window.startPlayState();
    });
  }
}
