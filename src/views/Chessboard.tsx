import { useState } from 'react';
import { ChessBoard } from 'chessboardjs';


import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const board = ChessBoard('board1', {
      draggable: true,
      dropOffBoard: 'trash',
      sparePieces: true
    });
  }, []);

  return (
    <>
      <div>
        <div id="board1" style={{ width: 400 }}></div>
      </div>
    </>
  )
}

export default App
