import {getFetchUrl} from '../common/util';
import {useHistory} from "react-router-dom";
import commonCss from '../common/common.module.scss'
import css from './home.module.scss'
import db from '../common/database';
import hridWords from '../assets/human_readable_id_words.json';
import React, {useCallback, useEffect, useRef, useState} from 'react';

function generateRandomId() {
  const adjectives = hridWords.adjectives;
  const nouns = hridWords.nouns;

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return`${randomAdjective}-${randomNoun}`;
}

async function getNonCollisionId(callback) {
  let id;
  do {
    id = generateRandomId();
  } while (await db.roomExists(id));
  callback(id);
}

export default function Home() {
  const history = useHistory();

  const [title, setTitle] = useState(initTitle);
  const [roomId, setRoomId] = useState();
  const [joining, setJoining] = useState(false);

  const timersRef = useRef({});

  const titleLength = title.length;
  const isLoading = typeof roomId === 'undefined';

  if (isLoading) getNonCollisionId(setRoomId);

  function initTitle() {
    const letters = 'CODENAMES'.split('');
    return letters.map((letter, index) => ({
      index,
      letter,
      revealed: false,
      type: index < 4 ? 'blue' : 'red',
    }));
  }

  const flip = useCallback((index, reveal = true, unflip = true) => {
    setTitle(prevTitle => {
      prevTitle[index].revealed = reveal;
      return [...prevTitle];
    });

    if (reveal && unflip) {
      const timer = setTimeout(() => {
        flip(index, false);
      }, 2000);
      timersRef.current[timer] = true;
    }
  }, []);

  function handleRoomInput(event) {
    const originalValue = event.target.value 
    let roomId = originalValue;
    roomId = roomId.toLowerCase();
    roomId = roomId.replace(/ /g, '-');
    roomId = roomId.split('-').map(id => id.replace(/\W/g, '')).join('-');
    roomId = roomId.slice(0, 50);
    setRoomId(roomId);
  };

  async function createRoom(event) {
    event.preventDefault();
    if (!roomId) return;
    setJoining(true);

    const url = getFetchUrl(roomId, '/rooms/create', {roomId});
    const response = await fetch(url, {method: 'POST'});
    const {status} = await response.json();
    setJoining(false);

    switch (status) {
      case 'already_exists':
      case 'created':
        history.push(`/room/${roomId}`);
        break;
      default:
    }
  };

  useEffect(() => {
    if (isLoading || !titleLength) return;

    const timer1 = setTimeout(() => {
      delete timersRef.current[timer1];
      const stagger = 100;
      for (let i = 0; i < titleLength; i++) {
        const timer2 = setTimeout(() => {
          delete timersRef.current[timer2];
          flip(i, true, false);
        }, i * stagger);
        const timer3 = setTimeout(() => {
          delete timersRef.current[timer3];
          flip(i, false);
        }, 800 + (i * stagger));
        timersRef.current[timer2] = true;
        timersRef.current[timer3] = true;
  }
    }, 500);
    timersRef.current[timer1] = true;

    const timer4 = setTimeout(() => {
      delete timersRef.current[timer4];
      (function randomInterval() {
        const timer5 = setTimeout(() => {
          delete timersRef.current[timer5];
          const randomIndex = Math.floor(Math.random() * titleLength);
          flip(randomIndex, true);
          randomInterval();
        }, 200 + (Math.random() * 800));
        timersRef.current[timer5] = true;
      })();
    }, 2000);
    timersRef.current[timer4] = true;
  }, [isLoading, titleLength, flip]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => Object.keys(timersRef.current).map(Number).forEach(clearTimeout);
  }, [])

  if (isLoading) return (<div></div>)

  return (
    <div className={css.home}>
      <div className={css.title}>
        {title.map(card =>
          <div 
            key={card.index} 
            className={css.card} 
            onClick={() => flip(card.index, true)}
          >
            <div 
              className={css.cardInner} 
              data-revealed={card.revealed}
              data-type={card.type}
            >
              <div className={css.cardFront}>
                {card.letter}
              </div>
              <div className={css.cardBack}>
                {card.letter}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={css.callToAction}>
        Create a room and invite your friends to play!
      </div>

      <div className={css.input}>
        <form onSubmit={createRoom}>
          <input 
            type="text"
            className={css.textInput} 
            value={roomId}
            onChange={handleRoomInput}
            disabled={joining}
            autoFocus
          />
        </form>
        <div className={`${css.controls} ${commonCss.controls}`}>
          <div onClick={createRoom} data-disabled={joining}>
            Create
          </div>
        </div>  
      </div>
    </div>
  );  
}