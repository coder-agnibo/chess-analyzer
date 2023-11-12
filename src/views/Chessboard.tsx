import { useState } from 'react';
import Chessboard from 'chessboardjsx';
import { getMovesListFromPGN, playMove } from "../utils/chessUtil";


import { useEffect } from 'react';

function App() {
  const [position, setPosition] = useState("start");


  const animateMoves = (moves: Array<string>) => {
      let index = 0;
      let fen: string | undefined = undefined;
      const interval = setInterval(() => {
          if (index < moves.length) {
              fen = playMove(moves[index], fen);
              setPosition(fen);
              index++;
          } else {
              clearInterval(interval);
          }
      }, 1000); // Adjust the interval as needed
  };

  useEffect(() => {
    const movesList = getMovesListFromPGN()
    animateMoves(movesList);
  }, []);

  return (
    <>
      <div>
        <Chessboard position={position} orientation='black'/>
      </div>
    </>
  )
}

export default App
