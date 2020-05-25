import css from './board.module.scss'
import React, {useEffect, useState} from 'react';
import {getFetchUrl} from '../common/util';

const CARDS_PER_ROW = 5;

const Board = React.memo((props) => {
  const {roomId, userId, board, setPolling} = props;

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

  function getCardInnerClasses(card) {
    return [
      'cardInner',
      card.revealed ? 'revealed' : '',
      card.revealed ? card.type : '',
    ].filter(Boolean).map(name => css[name]).join(' ');
  }

  async function revealCard(card) {
    if (board[card.index].revealed) return;
    if (revealing) return;
    board[card.index].revealed = true;
    setRevealing(true);
    setPolling(false);

    const url = getFetchUrl(roomId, '/game/reveal', {roomId, userId, cardIndex: card.index});
    await (await fetch(url, {method: 'POST'})).json();
    setRevealing(false);
    setPolling(true);
  }

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
    </div>
  );
});
export default Board;