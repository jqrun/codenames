import css from './home.module.scss'
import hridWords from '../assets/human_readable_id_words.json';
import React, {useEffect, useState} from 'react';
import {getFetchUrl} from '../common/util';
import {useHistory} from "react-router-dom";

function generateRandomId() {
  const adjectives = hridWords.adjectives;
  const nouns = hridWords.nouns;

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 10);

  return`${randomAdjective}-${randomNoun}-${randomNumber}`;
}

export default function Home() {
  const history = useHistory();

  const [roomId, setRoomId] = useState(generateRandomId());
  const [joining, setJoining] = useState(false);

  function handleRoomInput(event) {
    const originalValue = event.target.value 
    let roomId = originalValue;
    roomId = roomId.toLowerCase();
    roomId = roomId.replace(/ /g, '-');
    roomId = roomId.split('-').map(id => id.replace(/\W/g, '')).join('-');
    roomId = roomId.slice(0, 100);
    setRoomId(roomId);
  };

  async function createOrJoinRoom(event) {
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
      <form onSubmit={createOrJoinRoom}>
        <input 
          type="text"
          className={css.input} 
          value={roomId}
          onChange={handleRoomInput}
          disabled={joining}
          autoFocus
        />
      </form>
    </div>
  );  
}