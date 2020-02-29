import React from 'react'
import './home.scss'
import { Demo } from '~@/widget/demo/demo'

// + declare & interface
interface HomeProps {

}
interface HomeState {

}
// - declare & interface

export class Home extends React.Component<HomeProps, HomeState> {
  constructor (props: HomeProps) {
    super(props)
    this.state = {}
  }
  render () {
    return (
      <div className='page-home'>
        <div className='page-home-circlebox'>
          <Demo title='hello YY' />
        </div>
        <div className='page-home__tl' />
      </div>
    )
  }
}