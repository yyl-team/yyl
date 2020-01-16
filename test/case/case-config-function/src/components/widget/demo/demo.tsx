import * as React from 'react'

import './demo.scss'

interface IProps {
  title?: string
}

interface IState {
  type: number
}

export class Demo extends React.Component<IProps, IState> {
  constructor (props: IProps) {
    super(props)
    this.state = {
      type: 0
    }
  }
  public componentDidMount () {
    let padding = 0
    const runner = () => {
      this.setState({
        type:  ++padding % 4
      })
    }
    setInterval(runner, 1000)
    runner()
  }
  public render () {
    return (
      <div className='demo-circlebox'>
        <img
          className={`demo-circlebox__img demo-circlebox__img--type${this.state.type}`}
          alt=''
          src={require('./images/logo.png')}
        />
        <div className='page-index__tl'>{this.props.title}{this.state.type}</div>
      </div>
    )
  }
}
