import './base.scss';
import './index.css';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import Footer from './common/footer.js';
import Home from './home/home';
import React from 'react';
import ReactDOM from 'react-dom';
import Room from './room/room.js';

function NoRouteMatched() {
  return <div className="centeredFlex" style={{fontSize: "36px"}}>404, page not found</div>
}

function App() {
  return (
    <Router>
      <div className="app">
        <div className="appBody">
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
        </div>
        <div className="appFooter">
          <Footer />
        </div>
      </div>
    </Router>
  );  
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);