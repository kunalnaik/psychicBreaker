class bootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  create() {
    this.scene.start('load');
  }
}
