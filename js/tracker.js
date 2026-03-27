window.xprediction = null;
window.prev_predict = null;
window.yprediction = null;
window.prev_ypredict = null;

function ensurePsychicTrackerState() {
  if (!window.psychicTrackerState) {
    window.psychicTrackerState = {};
  }

  window.psychicTrackerState.ready = Boolean(window.psychicTrackerState.ready);
  window.psychicTrackerState.error = window.psychicTrackerState.error || null;
  window.psychicTrackerState.hasPrediction = Boolean(window.psychicTrackerState.hasPrediction);
  window.psychicTrackerState.prediction = window.psychicTrackerState.prediction || null;
  window.psychicTrackerState.beginCalled = Boolean(window.psychicTrackerState.beginCalled);
  window.psychicTrackerState.initializing = Boolean(window.psychicTrackerState.initializing);
  window.psychicTrackerState.predictionPollActive = Boolean(window.psychicTrackerState.predictionPollActive);
  window.psychicTrackerState.webcamReady = Boolean(window.psychicTrackerState.webcamReady);
  window.psychicTrackerState.webcamPollActive = Boolean(window.psychicTrackerState.webcamPollActive);
  window.psychicTrackerState.sessionNonce = Number.isFinite(window.psychicTrackerState.sessionNonce)
    ? window.psychicTrackerState.sessionNonce
    : 0;
  window.psychicTrackerState.pendingShutdownTimer = window.psychicTrackerState.pendingShutdownTimer || null;

  return window.psychicTrackerState;
}

function ingestPrediction(data, timestamp) {
  // Bypassed: We now use direct head tracking in play.js instead of gaze regression.
}

window.initPsychicTracker = function initPsychicTracker() {
  const trackerState = ensurePsychicTrackerState();

  if (trackerState.pendingShutdownTimer) {
    clearTimeout(trackerState.pendingShutdownTimer);
    trackerState.pendingShutdownTimer = null;
  }

  trackerState.sessionNonce += 1;

  if (trackerState.initializing || trackerState.beginCalled) {
    return;
  }

  trackerState.error = null;

  if (typeof window.webgazer === 'undefined') {
    trackerState.error = 'WebGazer script unavailable';
    return;
  }

  try {
    trackerState.initializing = true;

    if (typeof window.webgazer.setRegression === 'function') {
      window.webgazer.setRegression('ridge');
    }

    if (typeof window.webgazer.setTracker === 'function') {
      window.webgazer.setTracker('TFFacemesh');
    }

    if (typeof window.webgazer.applyKalmanFilter === 'function') {
      window.webgazer.applyKalmanFilter(true);
    }

    if (typeof window.webgazer.addMouseEventListeners === 'function') {
      window.webgazer.addMouseEventListeners();
    }

    // Disabled GazeListener to prevent the old regression model and 
    // the new head-tracking model from fighting over the prediction state.

    const startResult = window.webgazer.begin();
    trackerState.beginCalled = true;

    if (typeof window.webgazer.resume === 'function') {
      window.webgazer.resume();
    }

    if (startResult && typeof startResult.then === 'function') {
      startResult
        .then(() => {
          trackerState.initializing = false;
        })
        .catch((error) => {
          trackerState.error = error && error.message ? error.message : 'Camera initialization failed';
          trackerState.ready = false;
          trackerState.beginCalled = false;
          trackerState.initializing = false;
        });
    } else {
      trackerState.initializing = false;
    }

    window.webgazer.showPredictionPoints(false);

    if (!trackerState.predictionPollActive && typeof window.webgazer.getCurrentPrediction === 'function') {
      trackerState.predictionPollActive = true;
      window.setInterval(() => {
        const currentState = ensurePsychicTrackerState();

        const maybePrediction = window.webgazer.getCurrentPrediction();
        if (maybePrediction && typeof maybePrediction.then === 'function') {
          maybePrediction.then((prediction) => {
            if (prediction) {
              ingestPrediction(prediction, Date.now());
            }
          }).catch(() => {
            // Ignore transient polling errors.
          });
        } else if (maybePrediction) {
          ingestPrediction(maybePrediction, Date.now());
        }
      }, 120);
    }

    if (!trackerState.webcamPollActive) {
      trackerState.webcamPollActive = true;
      window.setInterval(() => {
        const currentState = ensurePsychicTrackerState();
        const videoElement = document.getElementById('webgazerVideoFeed');
        const loaded = Boolean(
          videoElement &&
          typeof videoElement.readyState === 'number' &&
          videoElement.readyState >= 2 &&
          videoElement.videoWidth > 0
        );

        currentState.webcamReady = loaded;
        if (loaded && !currentState.hasPrediction && !currentState.error) {
          currentState.ready = false;
        }
      }, 120);
    }
  } catch (error) {
    trackerState.error = error && error.message ? error.message : 'Camera initialization failed';
    trackerState.ready = false;
    trackerState.beginCalled = false;
    trackerState.initializing = false;
  }
};

window.shutdownPsychicTracker = function shutdownPsychicTracker() {
  const trackerState = ensurePsychicTrackerState();
  const shutdownNonce = trackerState.sessionNonce;

  const forceStopVideoTracks = () => {
    const videoElements = Array.from(document.querySelectorAll('video'));
    videoElements.forEach((video) => {
      try {
        const stream = video.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (error) {
              // Ignore per-track stop errors.
            }
          });
        }
        video.srcObject = null;
      } catch (error) {
        // Ignore per-video errors.
      }
    });
  };

  try {
    if (typeof window.webgazer !== 'undefined') {
      if (typeof window.webgazer.clearGazeListener === 'function') {
        window.webgazer.clearGazeListener();
      }
      if (typeof window.webgazer.removeMouseEventListeners === 'function') {
        window.webgazer.removeMouseEventListeners();
      }
      if (typeof window.webgazer.showPredictionPoints === 'function') {
        window.webgazer.showPredictionPoints(false);
      }
      if (typeof window.webgazer.stopVideo === 'function') {
        window.webgazer.stopVideo();
      }
      if (typeof window.webgazer.pause === 'function') {
        window.webgazer.pause();
      }
    }
  } catch (error) {
    // Ignore shutdown errors to avoid blocking quit flow.
  }

  forceStopVideoTracks();

  trackerState.pendingShutdownTimer = window.setTimeout(() => {
    const currentState = ensurePsychicTrackerState();
    if (currentState.sessionNonce !== shutdownNonce || currentState.beginCalled) {
      return;
    }

    try {
      if (typeof window.webgazer !== 'undefined' && typeof window.webgazer.stopVideo === 'function') {
        window.webgazer.stopVideo();
      }
    } catch (error) {
      // Ignore delayed stop errors.
    }
    forceStopVideoTracks();
    currentState.pendingShutdownTimer = null;
  }, 120);

  window.xprediction = null;
  window.prev_predict = null;
  window.yprediction = null;
  window.prev_ypredict = null;

  trackerState.ready = false;
  trackerState.hasPrediction = false;
  trackerState.prediction = null;
  trackerState.beginCalled = false;
  trackerState.initializing = false;
  trackerState.predictionPollActive = false;
  trackerState.webcamReady = false;
  trackerState.webcamPollActive = false;
  trackerState.error = null;
};

window.initPsychicTracker();
