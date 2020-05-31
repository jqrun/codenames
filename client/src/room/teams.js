import commonCss from '../common/common.module.scss'
import css from './teams.module.scss'
import React, {useEffect, useState} from 'react';
import {getFetchUrl} from '../common/util';

const Teams = React.memo((props) => {
  const {roomId, userId, users} = props;

  const blueTeam = {spymaster: getSpymaster('blue'), players: getTeam('blue'), team: 'blue'};
  const redTeam = {spymaster: getSpymaster('red'), players: getTeam('red'), team: 'red'};
  const teams = [blueTeam, redTeam];

  const isSpymaster = users[userId].spymaster;
  const currentTeam = users[userId].team;

  const [togglingSpymaster, setTogglingSpymaster] = useState(false);
  const [switchingTeam, setSwitchingTeam] = useState(false);

  function getSpymaster(color) {
    return Object.values(users).filter(user => user.spymaster && (user.team === color))[0];
  }

  function getTeam(color) {
    const team = Object.values(users).filter(user => user.team === color);
    team.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    return team;
  }

  async function toggleSpymaster() {
    if (togglingSpymaster) return;
    setTogglingSpymaster(true);
    const url = getFetchUrl(roomId, '/users/toggle-spymaster', {roomId, userId});
    await fetch(url, {method: 'POST'});
  }

  async function switchTeam() {
    if (switchingTeam) return;
    setSwitchingTeam(true);
    const url = getFetchUrl(roomId, '/users/switch-team', {roomId, userId});
    await fetch(url, {method: 'POST'});
  }

  useEffect(() => {
    setTogglingSpymaster(false);
  }, [isSpymaster]);

  useEffect(() => {
    setSwitchingTeam(false);
  }, [currentTeam]);

  return (
    <div className={css.teams}>
      <div className={css.players}>
        {teams.map((team, index) =>
          <div key={index} className={css.teamList} data-team={team.team}>
            {team.players.map(user => 
              <div 
                key={user.name} 
                className={css.user}
                data-team={user.team}
                data-current={user.current}
                data-spymaster={user.spymaster}
              >
                <div className={css.userName} title={user.name}>{user.name}</div>
              </div>
            )}
          </div> 
        )}
      </div>
      <div className={`${css.controls} ${commonCss.controls}`}>
        <div 
          className={css.toggleSpymaster}
          onClick={toggleSpymaster}
          data-disabled={togglingSpymaster}
        >
          Toggle Spymaster
        </div>
        <div 
          className={css.switchTeam}
          onClick={switchTeam}
          data-disabled={switchingTeam}
        >
          Switch Teams
        </div>
      </div>
    </div>
  );
});
export default Teams;