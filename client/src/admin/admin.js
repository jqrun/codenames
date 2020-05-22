import css from './admin.module.scss'
import React, {useEffect, useState} from 'react';
import {serverUrl} from '../common/util';

export default function Admin() {
  const [key, setKey] = useState(initializeKey);
  const [rooms, setRooms]  = useState([]);

  function initializeKey() {
    const sessionStorageItem = 'codenames-admin-key';
    const sessionKey = sessionStorage.getItem(sessionStorageItem);
    if (sessionKey) return sessionKey;
    const inputKey = prompt('');
    sessionStorage.setItem(sessionStorageItem, inputKey);
    return inputKey;   
  }

  // Fetch rooms
  useEffect(() => {
    if (!key) return;

    (async () => {
      const url = `${serverUrl}/admin/rooms`;
      const body = JSON.stringify({key});
      const headers =  {'Content-Type': 'application/json'}
      const method = 'POST';
      try {
        const data = await (await fetch(url, {method, headers, body})).json();
        const rooms = data.rooms.rows.map(room => room.doc);
        rooms.sort((a, b) => b.timestamps.lastUpdate - a.timestamps.lastUpdate);
        console.log(rooms);
        setRooms(rooms);
      } catch {}
    })();
  }, [key]);


  return (
    <div className={css.admin}>
      <div className={css.inner}>
        {rooms && rooms.map(room => 
          <div key={room._id} className={css.room}>
            {room._id}&nbsp;
            (Users: {Object.keys(room.users).length})&nbsp;
            (Last: {new Date(room.timestamps.lastUpdate).toLocaleString()})
          </div>
        )}
      </div>
    </div>
  );
}