import Home from './home.js';
import React from 'react';
import Room from './room.js';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

function NoRouteMatched() {
  return <div className="centeredFlex" style={{fontSize: "36px"}}>404, page not found</div>
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>

        <Route exact path="/room/:roomId">
          <Room />
        </Route>

         <Route path="*">
          <NoRouteMatched />
        </Route>
      </Switch>
    </Router>
  );  
}