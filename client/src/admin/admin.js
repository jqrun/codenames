import css from './admin.module.scss'
import React, {useEffect, useState} from 'react';
import {getServerUrl} from '../common/util';

export default function Admin() {
  const [key] = useState(initializeKey);
  const [rooms, setRooms]  = useState([]);

  function initializeKey() {
    const sessionKey = sessionStorage.getItem('codenames-admin-key');
    if (sessionKey) return sessionKey;
    const inputKey = prompt('');
    sessionStorage.setItem('codenames-admin-key', inputKey);
    return inputKey;   
  }

  // Fetch rooms
  useEffect(() => {
    if (!key) return;

    const fetchRooms = async () => {
      const url = `${getServerUrl(String(Math.random()))}/admin/rooms`;
      const body = JSON.stringify({key});
      const headers =  {'Content-Type': 'application/json'}
      const method = 'POST';
      try {
        const data = await (await fetch(url, {method, headers, body})).json();
        const {rooms} = data;
        rooms.sort((a, b) => b.timestamps.lastUpdate - a.timestamps.lastUpdate);
        console.log(rooms);
        setRooms(rooms);
        setTimeout(fetchRooms, 2500);
      } catch {}
    };
    fetchRooms();
  }, [key]);


  return (
    <div className={css.admin}>
      <div className={css.inner}>
        {rooms && rooms.map(room => 
          <div key={room.roomId} className={css.room}>
            {room.roomId}&nbsp;
            (Users: {Object.keys(room.users).length})&nbsp;
            (Last: {new Date(room.timestamps.lastUpdate).toLocaleString()})
          </div>
        )}
      </div>
    </div>
  );
}