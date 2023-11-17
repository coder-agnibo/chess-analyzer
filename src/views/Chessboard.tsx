import { useState } from 'react';
import Chessboard from 'chessboardjsx';
import { getMovesListFromPGN, playMove, analyzeGame } from "../utils/chessUtil";

type povType = "white" | "black";

import { useEffect } from 'react';

function App() {
  const [position, setPosition] = useState("start");
  const [pov, setPov] = useState("black" as povType);


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
    // const movesList = getMovesListFromPGN('');
    // animateMoves(movesList);
    analyzeGame()
    .then((res) => {
      console.log(res);
      // animateMoves(res.);
    })
    .catch((err) => {
      console.log("ERRRRRRROR::: ",err);
    })

  }, []);

  return (
    <>
      <div>
        <Chessboard position={position} orientation={pov}/>
      </div>
    </>
  )
}

export default App
