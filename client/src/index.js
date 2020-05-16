import './base.scss';
import './index.css';
import * as serviceWorker from './serviceWorker';
import Home from './home/home.js';
import React from 'react';
import ReactDOM from 'react-dom';
import Room from './room/room.js';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

function NoRouteMatched() {
  return <div className="centeredFlex" style={{fontSize: "36px"}}>404, page not found</div>
}

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>

        <Route exact path="/room/:roomId/">
          <Room />
        </Route>

         <Route path="*">
          <NoRouteMatched />
        </Route>
      </Switch>
    </Router>
  );  
}


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
