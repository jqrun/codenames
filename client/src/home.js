import styles from './home.module.scss'
import React, {useState} from 'react';

export default function Home() {
  const [roomName, setRoomName] = useState('');  

  const generateId = async () => {
    const response = await fetch('/rooms/generate-random');
    const data = await response.json();
    setRoomName(data.id);
  };

  generateId();

  return (
    <div>
      Home {roomName}
    </div>
  );  
}