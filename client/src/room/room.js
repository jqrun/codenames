import Join from './join';
import React, {useEffect, useState} from 'react';
import styles from './room.module.scss';
import {serverUrl} from '../common/util';
import {useParams} from 'react-router-dom';

export default function Room() {
  const {roomId} = useParams();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const deleteUser = () => {
      if (!user) return;

      const url = `${serverUrl}/rooms/${roomId}/users/delete/${user.userId}`;
      fetch(url, {method: 'POST'});
    };

    window.addEventListener('unload', deleteUser);

    return () => {
      window.removeEventListener('unload', deleteUser);
    };
  }, [user])

  return (
    <React.Fragment>
      {!user &&
        <Join roomId={roomId} setUser={setUser} />
      }

      {user &&
        <div style={styles.room}>
          Room: {roomId} <br />
          User: {user.name}
        </div>
      }
    </React.Fragment>
  );  
}