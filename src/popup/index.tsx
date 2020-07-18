import * as React from 'react'
import * as ReactDOM from 'react-dom'
import styled from 'styled-components'
// Shared components
import CompA from '../components/CompA'
// Private components
import App from './components/App'

const Global = styled.div`
  min-width: 800px;
  margin: 0;
  padding: 0;
  font-family: sans-serif;
`
/**
 * Shared component
 */

ReactDOM.render(
  <Global>
    <App />
    <CompA />
  </Global>,
  document.getElementById('root') as HTMLElement
)
