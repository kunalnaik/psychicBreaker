const GAME_CANVAS = {
  width: 700,
  height: 700
};

function getPlayBounds(canvasWidth, canvasHeight) {
  const sideInsetRatio = 0.005;
  const topInsetRatio = 0.075;
  const bottomInsetRatio = 0.025;

  const sideInset = Math.round(canvasWidth * sideInsetRatio);
  const topInset = Math.round(canvasHeight * topInsetRatio);
  const bottomInset = Math.round(canvasHeight * bottomInsetRatio);

  const width = canvasWidth - sideInset * 2;
  const height = canvasHeight - topInset - bottomInset;
  const x = sideInset;
  const y = topInset;

  return {
    x,
    y,
    width,
    height
  };
}

window.getPlayBounds = getPlayBounds;

function initPhaser() {
  window.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-canvas',
    resolution: 1,
    scale: {
      mode: Phaser.Scale.FIT,
      width: GAME_CANVAS.width,
      height: GAME_CANVAS.height,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
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
