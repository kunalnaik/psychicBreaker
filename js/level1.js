var level1State = {
  create: function() {
    game.stage.backgroundColor = '#0a0a1a';

    var levelText = game.add.text(game.world.width/2, game.world.height/2 - 40, 'LEVEL 1', {
      font: 'bold 48px "Press Start 2P"',
      fill: '#ffee00',
      stroke: '#ff6600',
      strokeThickness: 5
    });
    levelText.anchor.set(0.5);

    var subText = game.add.text(game.world.width/2, game.world.height/2 + 50, 'PRESS ENTER TO START', {
      font: '10px "Press Start 2P"',
      fill: '#ffffff'
    });
    subText.anchor.set(0.5);

    this.tween = game.add.tween(subText).to({ alpha: 0.3 }, 500, 'Linear', true, 0, -1, true);

    this.enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  },

  update: function() {
    if (this.enterKey.isDown || this.spaceKey.isDown) {
      game.state.start('play');
    }
  }
};
