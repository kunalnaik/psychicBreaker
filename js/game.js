function initPhaser() {
  window.game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#0a0a1a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        checkCollision: { down: false }
      }
    },
    scene: [bootScene, loadScene, trainScene, playScene]
  });
}
