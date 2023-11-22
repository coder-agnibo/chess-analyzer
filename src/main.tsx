import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Chessboard from './views/Chessboard.tsx'
import LoadPGN from './views/LoadPigeon.tsx'
import Demo from './views/Demo.tsx'
import Demo2 from './views/Demo2.tsx'


import './index.css'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";





const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />}>
      </Route>
      <Route path="/chessboard" element={<Chessboard />} />
      <Route path="/game/:id" element={<Chessboard />} />
      <Route path="/load-pgn" element={<LoadPGN />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/demo2" element={<Demo2 />} />
    </>
  )
);


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.Fragment>
    <RouterProvider router={router} />
  </React.Fragment>,
)
