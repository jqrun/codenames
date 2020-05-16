import Join from './join';
import React, {useState} from 'react';
import styles from './room.module.scss';
import {useParams} from 'react-router-dom';

export default function Room() {
  const {roomId} = useParams();

  const [user, setUser] = useState(null);

  return (
    <React.Fragment>
      {!user &&
        <Join roomId={roomId} setUser={setUser} />
      }

      {user &&
        <div style={styles.room}>
          Room {roomId} {user.nickname}
        </div>
      }
    </React.Fragment>
  );  
}