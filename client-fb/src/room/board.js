import css from './board.module.scss'
import React, {useEffect, useState} from 'react';
import {getFetchUrl, isDev} from '../common/util';

// Toggle for local development.
const ALWAYS_ALLOW_REVEAL = true;

const CARDS_PER_ROW = 5;

const Board = React.memo((props) => {
  const {roomId, userId, user, game, setPolling} = props;
  const {board} = game;
  const canReveal = getCanReveal();
  const gameOver = game.currentTurn.includes('win');
  const typesLeft = getTypesLeft();

  const [revealing, setRevealing] = useState(false);

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

  function getCardInnerClasses(card) {
    return [
      'cardInner',
      card.revealed ? 'revealed' : '',
      card.revealed ? card.type : '',
    ].filter(Boolean).map(name => css[name]).join(' ');
  }

  async function revealCard(card) {
    if (board[card.index].revealed || revealing || !canReveal || gameOver) return;
    board[card.index].revealed = true;
    setRevealing(true);
    setPolling(false);

    const url = getFetchUrl(roomId, '/game/reveal', {roomId, userId, cardIndex: card.index});
    await (await fetch(url, {method: 'POST'})).json();
    setPolling(true);
  }

  async function endTurn() {

  }

  useEffect(() => {
    setRevealing(false);
  }, [game]);

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
              <div className={getCardInnerClasses(card)}>
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
          <div className={css.newGameButton}>
            Hold for New Game
            <div className={css.newGameHold}></div>
          </div>
          <div className={css.endTurnButton} data-disabled={!canReveal} onClick={endTurn}>
            End Turn
          </div>
        </div>
      </div>
    </div>
  );
});
export default Board;