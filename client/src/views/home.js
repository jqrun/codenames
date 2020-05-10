import styles from './home.module.scss'
import React, {useEffect, useState} from 'react';
import Util from '../common/util';

export default function Home() {
  const [roomName, setRoomName] = useState('');
  const [generatedRoomName, setGeneratedRoomName] = useState('');  

  const generateRoomName = async () => {
    const response = await fetch(`${Util.serverUrl}/rooms/generate-random`);
    const data = await response.json();
    setGeneratedRoomName(data.id);
  };

  const createRoom = async (event) => {
    event.preventDefault();

    const response = await fetch(`${Util.serverUrl}/rooms/${roomName}`, {method: 'PUT'});
    const data = await response.text();
    console.log(data);
  };

  useEffect(() => {
    generateRoomName();
  },[]);

  if (!generatedRoomName) return (<div></div>)

  return (
    <div>
      Generated room name: {generatedRoomName} <br/><br/>
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