import * as React from 'react'
import styled from 'styled-components'
import { logIn, signUp, Session } from '../../background/helpers'
import { ExecSyncOptionsWithStringEncoding } from 'child_process'
const logo = require('../../assets/logo.png')

const AppLogo = styled.img`
  width: 100%;
  margin-bottom: 10px;
`

interface LoginProps {
  success: (session: Session) => void
}
interface LoginState {
  currentView: 'signUp' | 'logIn' | 'waiting' | 'error'
  username: string
  email: string
}

class Login extends React.Component<LoginProps, LoginState> {
  constructor(props){
    super(props)
    this.state = {
      currentView: 'logIn',
      username: '',
      email: ''
    }
  }

  changeView = (view: 'signUp' | 'logIn' | 'waiting' | 'error') => {
    this.setState({
      currentView: view
    })
  }

  login = async (event) => {
    event.preventDefault()
    try {
      if (this.state.username === '') return
      this.changeView("waiting")
      const session = await logIn(this.state.username)
      this.props.success(session)
    } catch (err) {
      this.changeView("error")
    }
  }

  signup = async (event) => {
    try {
      event.preventDefault()
      if (this.state.username === '') return
      if (this.state.email === '') return
      this.changeView("waiting")
      const session = await signUp(this.state.username, this.state.email)
      this.props.success(session)
    } catch (err) {
      this.changeView("error")
    }
  }

  renderLogo = () => {
    return (
      <AppLogo src={logo} alt='logo' />
    )
  }
  currentView = () => {
    switch(this.state.currentView) {
      case "error":
        return (
          <form>
            {this.renderLogo()}
            <fieldset>
              <h5>Sorry...</h5>
              <span>There has been an error.</span>
            </fieldset>
            <button type="button" onClick={ () => this.changeView("logIn")}>Retry</button>
          </form>
        )
        break
      case "waiting":
        return (
          <form>
            {this.renderLogo()}
            <fieldset>
              <h5>Email verification</h5>
              <span>Please check your email and click the verification link to complete login.</span>
            </fieldset>
            <button type="button" onClick={ () => this.changeView("logIn")}>Go back</button>
          </form>
        )
        break
      case "signUp":
        return (
          <form onSubmit={this.login}>
            {this.renderLogo()}
            <fieldset>
              <legend>Create Account</legend>
              <ul>
                <li>
                  <label htmlFor="username">Username:</label>
                  <input type="text" id="username" required/>
                </li>
                <li>
                  <label htmlFor="email">Email:</label>
                  <input type="email" id="email" required/>
                </li>
                <li>
                  <i/>
                  <a target="_blank" href="https://docs.textile.io">About Textile</a>
                </li>
              </ul>
            </fieldset>
            <button>Submit</button>
            <button type="button" onClick={ () => this.changeView("logIn")}>Have an Account?</button>
          </form>
        )
        break
      case "logIn":
        return (
          <form onSubmit={this.login}>
            {this.renderLogo()}
            <fieldset>
              <legend>Log In</legend>
              <ul>
                <li>
                  <label htmlFor="username">username:</label>
                  <input type="text" id="username" required onChange={(e) => this.setState({username: e.target.value})} value={this.state.username}/>
                </li>
                <li>
                  <i/>
                  <a target="_blank" href="https://docs.textile.io">About Textile</a>
                </li>
              </ul>
            </fieldset>
            <button>Login</button>
            <button type="button" onClick={ () => this.changeView("signUp")}>Create an Account</button>
          </form>
        )
        break
      default:
        break
    }
  }


  render() {
    return (
      <section id="entry-page">
        {this.currentView()}
      </section>
    )
  }
}

export default Login
