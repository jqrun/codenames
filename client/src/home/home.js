import commonCss from '../common/common.module.scss'
import css from './home.module.scss'
import db from '../common/database';
import hridWords from '../assets/human_readable_id_words.json';
import React, {useState} from 'react';
import {getFetchUrl} from '../common/util';
import {useHistory} from "react-router-dom";

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

  if (typeof roomId === 'undefined') getNonCollisionId(setRoomId);

  function initTitle() {
    
  }

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

  if (typeof roomId === 'undefined') return (<div></div>)

  return (
    <div className={css.home}>
      <div className={css.title}>

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