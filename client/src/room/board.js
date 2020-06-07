import {getFetchUrl, isDev} from '../common/util';
import {motion, useAnimation} from 'framer-motion';
import commonCss from '../common/common.module.scss'
import css from './board.module.scss'
import firebase from 'firebase/app';
import React, {useEffect, useRef, useState} from 'react';

import 'firebase/analytics';

const analytics = firebase.analytics();

// Toggle for local development.
const ALWAYS_ALLOW_REVEAL = false;

const CARDS_PER_ROW = 5;

const Board = React.memo((props) => {
  const {roomId, user, game} = props;
  const {board, currentTurn} = game;
  const {name} = user || {};
  const gameOver = currentTurn.includes('win');
  const canReveal = getCanReveal();
  const typesLeft = getTypesLeft();
  const isSpymaster = Boolean(user) && user.spymaster;

  const [endingTurn, setEndingTurn] = useState(false);
  const [holdingNewGame, setHoldingNewGame] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [startingNewGame, setStartingNewGame] = useState(false);

  const currentTurnControls = useAnimation();

  const newGameTimerRef = useRef();

  if (gameOver && !showAll) {
    setTimeout(() => setShowAll(true), 1000);
  } else if (!gameOver && showAll) {
    setShowAll(false);
  }

  function getCards(board) {
    const cards = [];
    let raw = Object.entries(board);
    raw.sort((a, b) => Number(a[0]) - Number(b[0]));
    raw = raw.map(([index, card]) => ({index, ...card}));
    for (let i = 0; i < raw.length; i += CARDS_PER_ROW) {
      cards.push(raw.slice(i, i + CARDS_PER_ROW));
    }
    return cards;
  }

  function getCanReveal() {
    if (gameOver) return false
    if (isDev && ALWAYS_ALLOW_REVEAL) return true;
    if (!user || user.spymaster) return false;
    return game.currentTurn.includes(user.team);
  }

  function getTypesLeft() {
    const types = Object.values(board).filter(card => !card.revealed).map(card => card.type);
    return {
      blue: types.filter(type => type === 'blue').length,
      red: types.filter(type => type === 'red').length,
      bystander: types.filter(type => type === 'bystander').length,
      assassin: types.filter(type => type === 'assassin').length,
    };
  }

  function getCurrentTurn() {
    const {currentTurn} = game;
    if (['blue', 'red'].includes(currentTurn)) {
      return `${currentTurn}'s turn`;
    }

    const winner = currentTurn.split('_win')[0];
    return `${winner} wins`;
  }

  function warnIfNotCurrentTurn() {
    if (user.spymaster) return;
    if (game.currentTurn.includes(user.team)) return;

    currentTurnControls.start({
      x: [
        '-0.2em', '0.2em', '-0.1em', '0.1em', 
        '-0.2em', '0.2em', '-0.1em', '0.1em', 
        '0em',
      ],
    })
  }

  async function revealCard(card) {
    warnIfNotCurrentTurn();
    if (board[card.index].revealed || revealing || !canReveal) return;
    board[card.index].revealed = true;
    setRevealing(true);

    const url = getFetchUrl(roomId, '/game/reveal', {roomId, name, cardIndex: card.index});
    await (await fetch(url, {method: 'POST'})).json();
    analytics.logEvent('game_reveal');
  }

  async function endTurn() {
    if (endingTurn) return;
    setEndingTurn(true);
    const url = getFetchUrl(roomId, '/game/end-turn', {roomId, name});
    await fetch(url, {method: 'POST'});
    analytics.logEvent('game_end_turn');
  }

  function startNewGame() {
    setHoldingNewGame(true);
    newGameTimerRef.current = setTimeout(() => {
      setStartingNewGame(true);
    const url = getFetchUrl(roomId, '/game/new-game', {roomId, name});
      fetch(url, {method: 'POST'});
      analytics.logEvent('game_new_game');
  }, 1000);
  }

  function cancelNewGame() {
    clearTimeout(newGameTimerRef.current);
    setHoldingNewGame(false);
  }

  useEffect(() => {
    setRevealing(false);
    setStartingNewGame(false);
  }, [game]);

  useEffect(() => {
    setEndingTurn(false);
  }, [currentTurn]);

  return (
    <div className={css.board}>
      {getCards(board).map((row, index) => 
        <div key={index} className={css.row}>
          {row.map(card => 
            <div 
              key={card.word} 
              className={css.card}
              onClick={() => revealCard(card)}
            >
              <div 
                className={css.cardInner}
                data-revealed={card.revealed || isSpymaster || (gameOver && showAll)}
                data-type={card.type}
              >
                <div className={css.cardFront}>
                  {card.word.toLowerCase()}
                </div>
                <div className={css.cardBack}>
                  {card.word.toLowerCase()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div className={css.bottomBar}>
        <div className={css.status}>
          <motion.div 
            className={css.currentTurn} 
            data-turn={game.currentTurn}
            animate={currentTurnControls}
            transition={{duration: 0.4, ease: 'easeOut'}}
          >
            {getCurrentTurn()}
          </motion.div>
          <div className={css.remaining}>
            (<span className={css.blueLeft}>{typesLeft.blue}</span>-
            <span className={css.redLeft}>{typesLeft.red}</span>)
          </div>
        </div>
        <div className={commonCss.controls}>
          <div 
            className={css.newGameButton} 
            data-disabled={startingNewGame}
            onMouseDown={startNewGame}
            onTouchStart={e => {e.preventDefault(); startNewGame()}}
            onMouseUp={cancelNewGame}
            onTouchEnd={cancelNewGame}
            onContextMenu={e => e.preventDefault()}
          >
            Hold for New Game
            <div 
              className={css.holdIndicator} 
              data-holding={holdingNewGame}
              data-complete={startingNewGame}
            ></div>
          </div>
          <div 
            className={css.endTurnButton} 
            data-disabled={!canReveal || endingTurn || isSpymaster} 
            onClick={endTurn}
          >
            End Turn
          </div>
        </div>
      </div>
    </div>
  );
});
export default Board;