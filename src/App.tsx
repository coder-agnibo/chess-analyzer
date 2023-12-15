import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <p className='mb-5'>Load PGN</p>
      <a href='/load-pgn' className='bg-red-300 text-gray-900 p-3 rounded-xl'>Load PGN</a>
    </>
  )
}

export default App
