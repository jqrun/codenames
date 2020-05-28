import css from './teams.module.scss'
import React, {useEffect, useState} from 'react';
import {getFetchUrl} from '../common/util';

const Teams = React.memo((props) => {
  const {roomId, userId, users} = props;

  const blueTeam = {spymaster: getSpymaster('blue'), players: getTeam('blue'), team: 'blue'};
  const redTeam = {spymaster: getSpymaster('red'), players: getTeam('red'), team: 'red'};
  const teams = [blueTeam, redTeam];

  function getSpymaster(color) {
    return Object.values(users).filter(user => user.spymaster && (user.team === color))[0];
  }

  function getTeam(color) {
    const team = Object.values(users).filter(user => !user.spymaster && (user.team === color));
    team.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    return team;
  }

  function switchTeam() {

  }

  function setSpymaster() {

  }

  return (
    <div className={css.teams}>
      <div className={css.inner}>
        {teams.map((team, index) =>
          <div key={index} className={css.teamList} data-team={team.team}>
            <div className={css.teamTitle}>{`${team.team} team`}</div>
            {team.players.map(user => 
              <div 
                key={user.name} 
                className={css.user}
                data-team={user.team}
                data-current={user.current}
                data-spymaster={user.current}
              >
                <div className={css.userName}>{user.name}</div>
              </div>
            )}
          </div> 
        )}
      </div>
    </div>
  );
});
export default Teams;