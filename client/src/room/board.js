import css from './board.module.scss'
import React, {useEffect, useState} from 'react';
import {serverUrl} from '../common/util';

const CARDS_PER_ROW = 5;

const Board = React.memo((props) => {
  const {roomId, userId, board} = props;

  const cards = getCards(board);

  function getCards(board) {
    const cards = [];
    let raw = Object.entries(board);
    raw.sort((a, b) => Number(a[0]) - Number(b[0]));
    raw = raw.map(([key, card]) => card);
    for (let i = 0; i < raw.length; i += CARDS_PER_ROW) {
      cards.push(raw.slice(i, i + CARDS_PER_ROW));
    }
    return cards;
  }

  return (
    <div className={css.board}>
      {cards.map((row, index) => 
        <div key={index} className={css.row}>
          {row.map(card => 
            <div key={card.word} className={css.word}>{card.word}</div>
          )}
        </div>
      )}
    </div>
  );
});
export default Board;