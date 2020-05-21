import css from './teams.module.scss'
import React, {useEffect, useState} from 'react';
import {serverUrl} from '../common/util';

const Teams = React.memo((props) => {
  const {roomId, userId, users} = props;

  const blueTeam = getTeam('blue');
  const redTeam = getTeam('red');

  function getTeam(color) {
    const team = Object.values(users).filter(user => user.team === color);
    team.sort();
    console.log(team);
    return team;
  }

  console.log(users);

  return (
    <div className={css.teams}>
      Teams <br/><br/>

      <div className={css.inner}>
        <div className={css.blueTeam}>
          {blueTeam.map(user => 
            <div key={user.name}>{user.name} {user.isCurrent ? 'this' : ''}</div>
          )}
        </div>

        <div className={css.redTeam}>
          {redTeam.map(user => 
            <div key={user.name}>{user.name} {user.isCurrent ? 'this' : ''}</div>
          )}
        </div>
      </div>
    </div>
  );
});
export default Teams;