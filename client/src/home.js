import styles from './home.module.scss'
import React, {useEffect, useState} from 'react';

export default function Home() {
  const [roomName, setRoomName] = useState('');
  const [generated, setGenerated] = useState('');  

  const generateId = async () => {
    const response = await fetch('/rooms/generate-random');
    const data = await response.json();
    setGenerated(data.id);
  };

  const createRoom = async (event) => {
    event.preventDefault();

    const response = await fetch(`/rooms/${roomName}`, {method: 'PUT'});
    const data = await response.text();
    console.log(data);
  };


  useEffect(() => {
    generateId();
  },[]);

  return (
    <div>
      Generated id: {generated} <br/><br/>
      <form onSubmit={createRoom}>
        <input 
          tyle="text"
          className={styles.input} 
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
        />
      </form>
    </div>
  );  
}