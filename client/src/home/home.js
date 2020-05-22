import css from './home.module.scss'
import React, {useEffect, useState} from 'react';
import {serverUrl} from '../common/util';
import {useHistory} from "react-router-dom";

export default function Home() {
  const history = useHistory();

  const [roomId, setRoomId] = useState(undefined);

  async function generateRoomId() {
    const response = await fetch(`${serverUrl}/rooms/generate-random`);
    const data = await response.json();
    setRoomId(data.name);
  };

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

    const response = await fetch(`${serverUrl}/rooms/create/${roomId}`, {method: 'POST'});
    const {status} = await response.json();

    switch (status) {
      case 'already_exists':
      case 'created':
        history.push(`/room/${roomId}`);
        break;
      default:
    }
  };

  useEffect(() => {
    generateRoomId();
  },[]);

  if (typeof roomId === 'undefined') return (<div></div>)

  return (
    <div className={css.home}>
      <form onSubmit={createOrJoinRoom}>
        <input 
          type="text"
          className={css.input} 
          value={roomId}
          onChange={handleRoomInput}
          autoFocus
        />
      </form>
    </div>
  );  
}