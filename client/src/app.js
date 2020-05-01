import React from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

function NoRouteMatched() {
  return <div className="centeredFlex" style={{fontSize: "36px"}}>404, page not found</div>
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <NoRouteMatched />
        </Route>

         <Route path="*">
          <NoRouteMatched />
        </Route>
      </Switch>
    </Router>
  );  
}