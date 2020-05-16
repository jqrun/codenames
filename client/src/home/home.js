import React, {useEffect, useState} from 'react';
import styles from './home.module.scss'
import {serverUrl} from '../common/util';
import {useHistory} from "react-router-dom";

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [roomExistsError, setRoomExistsError] = useState(false);

  const history = useHistory();

  const generateRoomId = async () => {
    const response = await fetch(`${serverUrl}/rooms/generate-random`);
    const data = await response.json();
    setRoomId(data.name);
  };

  const createRoom = async (event) => {
    event.preventDefault();

    const response = await fetch(`${serverUrl}/rooms/create/${roomId}`, {method: 'POST'});
    const {status} = await response.json();

    switch (status) {
      case 'already_exists':
        setRoomExistsError(true);
        break;
      case 'created':
        history.push(`/room/${roomId}`);
        break;
      default:
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