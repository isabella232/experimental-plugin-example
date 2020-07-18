import * as React from 'react'
import styled, { keyframes } from 'styled-components'
const logo = require('../../../assets/logo.svg')

const AppLogoSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const App = styled.div`
  text-align: center;
`

const AppLogo = styled.img`
  animation: ${AppLogoSpin} infinite 20s linear;
  height: 80px;
`

const AppHeader = styled.div`
  background-color: #222;
  height: 150px;
  padding: 20px;
  color: white;
`
const AppIntro = styled.p`
  font-size: large;
`

const Comp = () => (
  <App>
    <AppHeader>
      <AppLogo src={logo} alt='logo' />
      <h2>Create React Typescript Sass Webextension</h2>
    </AppHeader>
    <AppIntro>
      Check <a href='https://github.com/crimx/create-react-typescript-sass-webextension' target='_blank' rel='noopener'>README</a> for instructions.
    </AppIntro>
  </App>)

export default Comp
