import {
  delay,
  fetchGameStart,
  getFrameByTurn,
  streamAllFrames
} from "../utils/engine-client";

const DEFAULT_FPS = 20;

export const setEngineOptions = engineOptions => ({
  type: "SET_ENGINE_OPTIONS",
  engineOptions
});

export const gameOver = () => ({
  type: "GAME_OVER"
});

export const requestFrames = () => ({
  type: "REQUEST_FRAMES"
});

export const receiveFrame = (game, frame) => ({
  type: "RECEIVE_FRAME",
  game,
  frame
});

export const setCurrentFrame = frame => ({
  type: "SET_CURRENT_FRAME",
  frame
});

export const setGameStatus = status => ({
  type: "SET_GAME_STATUS",
  status
});

export const pauseGame = () => ({
  type: "PAUSE_GAME"
});

export const resumeGame = () => ({
  type: "RESUME_GAME"
});

export const highlightSnake = snakeId => ({
  type: "HIGHLIGHT_SNAKE",
  snakeId
});

export const fetchFrames = () => {
  return async (dispatch, getState) => {
    const {
      autoplay,
      engine: engineUrl,
      game: gameId,
      turn
    } = getState().engineOptions;

    dispatch(requestFrames());

    await streamAllFrames(engineUrl, gameId, (game, frame) => {
      dispatch(setGameStatus(game.Game.Status));

      // Workaround for bug where turn exluded on turn 0
      frame.Turn = frame.Turn || 0;
      dispatch(receiveFrame(game, frame));

      // Workaround to render the first frame into the board
      if (frame.Turn === 0) {
        const frame = getState().frames[0];
        dispatch(setCurrentFrame(frame));
      }
    });

    if (autoplay) {
      const frame = getState().frames[0];
      dispatch(resumeGame());
      dispatch(playFromFrame(frame));
    }

    // Only navigate to the specified frame if it is within the
    // amount of frames available in the game
    if (turn && turn <= getState().frames.length) {
      const frame = getState().frames[turn];
      dispatch(setCurrentFrame(frame));
    }
  };
};

export const playFromFrame = frame => {
  return async (dispatch, getState) => {
    const { frameRate } = getState().engineOptions;
    const frames = getState().frames.slice(); // Don't modify in place
    const frameIndex = frames.indexOf(frame);
    const slicedFrames = frames.slice(frameIndex);

    const ceiledFps = Math.ceil(frameRate || DEFAULT_FPS);
    const delayMillis = 1000 / ceiledFps;

    for (const frame of slicedFrames) {
      if (getState().paused) return;
      dispatch(setCurrentFrame(frame));
      await delay(delayMillis);
    }

    const lastFrame = slicedFrames[slicedFrames.length - 1];
    if (lastFrame.gameOver) {
      if (!getState().paused) dispatch(gameOver());
    } else {
      dispatch(playFromFrame(lastFrame));
    }
  };
};

export const reloadGame = () => {
  return async (dispatch, getState) => {
    const { frames, paused } = getState();
    if (paused) {
      const frame = getFrameByTurn(frames, 0);
      dispatch(setCurrentFrame(frame));
    }
  };
};

export const toggleGamePause = () => {
  return async (dispatch, getState) => {
    const { currentFrame, gameStatus, paused, engineOptions } = getState();

    if (paused) {
      if (gameStatus === "stopped") {
        await fetchGameStart(engineOptions.engine, engineOptions.game);
        dispatch(fetchFrames());
      }

      dispatch(resumeGame());
      dispatch(playFromFrame(currentFrame));
    } else {
      dispatch(pauseGame());
    }
  };
};

export const stepForwardFrame = () => {
  return async (dispatch, getState) => {
    const { currentFrame, frames } = getState();
    const nextFrame = currentFrame.turn + 1;
    const stepToFrame = getFrameByTurn(frames, nextFrame);
    if (stepToFrame) {
      dispatch(setCurrentFrame(stepToFrame));
    }
  };
};

export const stepBackwardFrame = () => {
  return async (dispatch, getState) => {
    const { currentFrame, frames } = getState();
    const prevFrame = currentFrame.turn - 1;
    const stepToFrame = getFrameByTurn(frames, prevFrame);
    if (stepToFrame) {
      dispatch(setCurrentFrame(stepToFrame));
    }
  };
};
