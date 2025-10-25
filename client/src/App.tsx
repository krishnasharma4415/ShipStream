import './App.css'
import { Landing } from './components/landing'
import { ErrorBoundary } from './components/error-boundary'

function App() {
  return (
    <ErrorBoundary>
      <Landing />
    </ErrorBoundary>
  )
}

export default App
