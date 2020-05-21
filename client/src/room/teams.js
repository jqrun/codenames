import css from './teams.module.scss'
import React, {useEffect, useState} from 'react';
import {serverUrl} from '../common/util';

const Teams = React.memo((props) => {
  const {roomId, userId, users} = props;

  console.log(users);

  return (
    <div className={css.team}>
      Teams <br/><br/>
      {Object.values(users).map(user => 
        <div key={user.name}>{user.name}</div>
      )}
    </div>
  );
});
export default Teams;