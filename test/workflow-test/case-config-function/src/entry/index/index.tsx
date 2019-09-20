import * as React from 'react'
import * as ReactDom from 'react-dom'
import { Demo } from '~/components/widget/demo/demo'

import './index.scss'

const App = (
  <div className='page-index'>
    <div className='page-index-circlebox'>
      <Demo title='hello YY'/>
    </div>
    <div className='page-index__tl'/>
  </div>
)

// import wDemo from '../../components/widget/demo/demo';
// wDemo();

ReactDom.render(App, document.getElementById('app'))
