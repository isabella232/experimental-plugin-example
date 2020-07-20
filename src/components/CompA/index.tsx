/**
 * Shared component
 */
import * as React from 'react'
import Login from './login'
import '../style/index.scss'
import { Session, getSession, storeSession, removeSession } from '../../background/helpers'
import Gallery from './gallery'

interface StateInterface {
  session?: Session
  bucketKey?: string
  preLoading: boolean
  isLoading: boolean
}

class Comp extends React.Component<{}, StateInterface> {
  constructor(props) {
    super(props);
    this.state = {
      preLoading: true,
      isLoading: true
    }
    this.restoreSession().catch(err=>console.log(err))
  }
  handleLogin = async (session: Session) => {
    await storeSession(session)
    this.setState({
      session
    })
  }
  handleLogout = async () => {
    console.log('logout')
    await removeSession()
    this.setState({
      session: undefined
    })
  }

  async restoreSession () {
    const session = await getSession()
    this.setState({
      session,
      preLoading: false
    })
  }

  renderLogin = () => {
    return (
      <div>
        <Login success={this.handleLogin} />
      </div>
    )
  }

  handleReset = async () => {
    await this.handleLogout()
  }

  render () {
    if (!this.state.session && !this.state.preLoading) {
      return this.renderLogin()
    }
    return (
      <div className='app'>
        <div>
          {!!this.state.session && <Gallery reset={this.handleReset} session={this.state.session} />}
        </div>
        <div className={'logout'}>
          <a onClick={this.handleLogout}>logout</a>
        </div>
      </div>
    )
  }
}

export default Comp
