import css from './teams.module.scss'
import React, {useEffect, useState} from 'react';
import {serverUrl} from '../common/util';

const Teams = React.memo((props) => {
  const {roomId, userId, users} = props;

  const blueTeam = getTeam('blue');
  const redTeam = getTeam('red');
  const teams = [blueTeam, redTeam];

  function getTeam(color) {
    const team = Object.values(users).filter(user => user.team === color);
    team.sort();
    return team;
  }

  function getUserClasses(user) {
    const classes = [
      'user',
      user.team,
      user.current ? 'current': '', 
      user.spymaster ? 'spymaster': '',
    ];
    return classes.map(name => css[name]).join(' ');
  }

  return (
    <div className={css.teams}>
      Teams <br/><br/>

      <div className={css.inner}>
        {teams.map((team, index) =>
          <div key={index} className={css.teamList}>
            {team.map(user => 
              <div key={user.name} className={getUserClasses(user)}>
                {user.name}
              </div>
            )}
          </div> 
        )}
      </div>
    </div>
  );
});
export default Teams;