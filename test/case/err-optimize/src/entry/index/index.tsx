import React from 'react'
import ReactDom from 'react-dom'
import { HashRouter as Router, Route, Switch } from 'react-router-dom'

import './index.scss'
import { routes } from '~/routes/index'

const App => (
  <Router>
    <Switch>
      {routes.map((item, index) => {
        return (
          <Route exact={true} path={item.path} component={item.component} key={index} />
        )
      })}
    </Switch>
  </Router>
)


ReactDom.render(App, document.getElementById('app'))
