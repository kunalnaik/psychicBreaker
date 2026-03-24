window.xprediction = null;
window.prev_predict = null;

window.webgazer.begin();

webgazer.showPredictionPoints(true);

webgazer.setGazeListener(function(data, timestamp) {
  if (data) {
    window.prev_predict = window.xprediction;
    window.xprediction = data.x;
  }
});
