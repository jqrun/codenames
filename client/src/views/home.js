import styles from './home.module.scss'
import React, {useEffect, useState} from 'react';
import {serverUrl} from '../common/util';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [roomExistsError, setRoomExistsError] = useState(false);

  const generateRoomId = async () => {
    const response = await fetch(`${serverUrl}/rooms/generate-random`);
    const data = await response.json();
    setRoomId(data.name);
  };

  const createRoom = async (event) => {
    event.preventDefault();

    const response = await fetch(`${serverUrl}/rooms/create/${roomId}`, {method: 'POST'});
    const data = await response.json();

    if (data.status === 'already_exists') {
      setRoomExistsError(true);
    }
  };

  useEffect(() => {
    generateRoomId();
  },[]);

  if (!roomId) return (<div></div>)

  return (
    <div className={styles.home}>
      <form onSubmit={createRoom}>
        <input 
          tyle="text"
          className={styles.input} 
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
        />
      </form>
      {roomExistsError && 
        <div style={{color: "red"}}>This room already exists</div>
      }
    </div>
  );  
}