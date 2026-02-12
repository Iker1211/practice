import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="card">
      <h1>MyApp Mobile</h1>
      <button onClick={() => setCount(count + 1)}>
        Click count: {count}
      </button>
      <p>React app listo para integrar Capacitor</p>
    </div>
  )
}

export default App
