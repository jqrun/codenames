import css from './board.module.scss'
import React, {useEffect, useRef, useState} from 'react';
import {getFetchUrl, isDev} from '../common/util';

// Toggle for local development.
const ALWAYS_ALLOW_REVEAL = true;

const CARDS_PER_ROW = 5;

const Board = React.memo((props) => {
  const {roomId, userId, user, game} = props;
  const {board, currentTurn} = game;
  const gameOver = currentTurn.includes('win');
  const canReveal = getCanReveal();
  const typesLeft = getTypesLeft();
  const isSpymaster = user.spymaster;

  const [revealing, setRevealing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [endingTurn, setEndingTurn] = useState(false);
  const [startingNewGame, setStartingNewGame] = useState(false);
  const [holdingNewGame, setHoldingNewGame] = useState(false);

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

  async function revealCard(card) {
    if (board[card.index].revealed || revealing || !canReveal) return;
    board[card.index].revealed = true;
    setRevealing(true);

    const url = getFetchUrl(roomId, '/game/reveal', {roomId, userId, cardIndex: card.index});
    await (await fetch(url, {method: 'POST'})).json();
  }

  async function endTurn() {
    if (endingTurn) return;
    setEndingTurn(true);
    const url = getFetchUrl(roomId, '/game/end-turn', {roomId, userId});
    await fetch(url, {method: 'POST'});
  }

  function startNewGame() {
    setHoldingNewGame(true);
    newGameTimerRef.current = setTimeout(() => {
      setStartingNewGame(true);
      const url = getFetchUrl(roomId, '/game/new-game', {roomId, userId});
      fetch(url, {method: 'POST'});
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
          <div className={css.currentTurn} data-turn={game.currentTurn}>
            {getCurrentTurn()}
          </div>
          <div className={css.remaining}>
            (<span className={css.blueLeft}>{typesLeft.blue}</span>-
            <span className={css.redLeft}>{typesLeft.red}</span>)
          </div>
        </div>
        <div className={css.controls}>
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