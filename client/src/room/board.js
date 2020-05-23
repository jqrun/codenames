import css from './board.module.scss'
import React, {useEffect, useState} from 'react';
import {getServerUrl} from '../common/util';

const CARDS_PER_ROW = 5;

const Board = React.memo((props) => {
  const {roomId, userId, board} = props;

  const cards = getCards(board);

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

  function getCardClasses(card) {
    return [
      'card',
      card.revealed ? 'revealed' : '',
      card.revealed ? card.type : '',
    ].filter(Boolean).map(name => css[name]).join(' ');
  }

  async function revealCard(card) {
    setRevealing(true);
    const url = `${getServerUrl(roomId)}/rooms/${roomId}/game/${userId}/reveal/${card.index}`;
    const {revealed} = await (await fetch(url, {method: 'POST'})).json();
    setRevealing(false);
  }

  return (
    <div className={css.board}>
      {cards.map((row, index) => 
        <div key={index} className={css.row}>
          {row.map(card => 
            <div 
              key={card.word} 
              className={getCardClasses(card)}
              onClick={() => revealCard(card)}
            >
              {card.word.toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
export default Board;