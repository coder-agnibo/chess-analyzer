import { useState } from 'react';
import Chessboard from 'chessboardjsx';
import { getMovesListFromPGN, playMove, ChessMoveAnalysis, getGameFromHash, getEngineAnalysisFromHash, getAIAnalysisFromHash} from "../utils/chessUtil";
import engineData from "../views/sed";
// import suggestData from "../views/sampleExplainData";
import classNames from "classnames";
import { useParams } from "react-router-dom";


type povType = "white" | "black";

import { useEffect } from 'react';


function responsiveChessboardCalcWidth({ screenWidth, screenHeight }: { screenWidth: number, screenHeight: number }) {
  console.log(screenWidth, screenHeight);

  if (screenWidth < 500) {
    return Math.min(screenWidth, screenHeight);
  } else {
    return 560;
  }
}



function App() {
  const [position, setPosition] = useState("start");
  const [pov, setPov] = useState("black" as povType);
  const [movesList, setMovesList] = useState<Array<object>>([]);
  const [currentMove, setCurrentMove] = useState(0);
  const [evaluation, setEvaluation] = useState("");
  const [evaluationPc, setEvaluationPc] = useState(50.0);
  const [suggestion, setSuggestion] = useState("Opening");
  const [altsuggest, setAltsuggest] = useState("Opening");
  const { id } = useParams();

  const [engineData, setEngineData] = useState<Array<ChessMoveAnalysis>>([]);
  const [suggestData, setSuggestData] = useState<AIAnalysis>({} as AIAnalysis);


  useEffect(() => {
    // analyzeGame()
    // setMovesList(engineData);
    // const movesList = getGameFromHash(id || "");
    const engineData = getEngineAnalysisFromHash(id || "");
    const suggestData = getAIAnalysisFromHash(id || "");

    setMovesList(engineData);
    setEngineData(engineData);
    setSuggestData(suggestData);
  }, []);


  useEffect(() => {
    if (currentMove >= 0 && currentMove < movesList.length) {
      const fen = movesList[currentMove].fen;
      setPosition(fen);

      if (movesList[currentMove].evaluation.startsWith("+M")) {
        setEvaluationPc(100);
        setEvaluation(movesList[currentMove].evaluation)
      } else if (movesList[currentMove].evaluation.startsWith("-M")) {
        setEvaluationPc(0);
        setEvaluation(movesList[currentMove].evaluation)
      }
      else {
        const normalized: number = Math.atan(movesList[currentMove].evaluation) / (0.5 * Math.PI);
        console.log(50 + (normalized * 50))
        setEvaluationPc(50 + (normalized * 50));
        setEvaluation(parseFloat(movesList[currentMove].evaluation));
      }

      setSuggestion(suggestData[currentMove].remark);
      setAltsuggest(suggestData[currentMove].alternative_with_explanation);
    }
  }, [currentMove]);


  return (
    <div className='flex flex-col h-screen'>
      <div className='flex-1'>
        <Chessboard position={position} orientation={pov}
          calcWidth={responsiveChessboardCalcWidth}
        />
      </div>

      <div className='flex-1 w-full flex h-5 relative'>
        <div style={{ 'transition': 'all 0.2s', 'width': `calc(${evaluationPc}% )`, 'background': '#DDD' }} className='h-5'></div>
        <div style={{ 'transition': 'all 0.2s', 'width': `calc(100% - ${evaluationPc}% )`, 'background': '#666' }} className='h-5'></div>

        <div className='absolute top-0 left-0 w-full h-5 text-center text-sm text-black'>
          {evaluation}
        </div>
      </div>

      <div className='bg-emerald-600 text-gray-200 flex-1'>
        Moves List
      </div>
      <div className='grid grid-cols-2 flex-auto overflow-auto bg-indigo-900'>

        {
          movesList.map((move, index) =>
            <div
              style={{ cursor: 'pointer' }}
              className={classNames({
                'font-bold': index <= currentMove,
                'text-gray-300': index !== currentMove,
              })}
              key={`moveList_${index}`}
              onClick={() => setCurrentMove(index)}>
              {move?.move}
            </div>
          )
        }
      </div>

      <div className='bg-fuchsia-900 flex-1 text-left p-3'>
        <p className='text-sm font-bold'>What ChessBot thinks</p>
        <p className='p-1 text-sm'>
          {suggestion}
        </p>
      </div>
      <div className='bg-slate-800 flex-1 text-left p-3'>
        <p className='text-sm font-bold'>Alternate Move</p>
        <p className='p-1 text-sm'>
          {altsuggest}
        </p>
      </div>

      <div className='flex-none'>
        <button onClick={() => setCurrentMove(currentMove - 1)}> Previous Move </button>
        <button onClick={() => setCurrentMove(currentMove + 1)}> Next Move </button>
        <button onClick={() => pov === 'black' ? setPov('white') : setPov('black')}> Toggle Pov </button>
      </div>
    </div>
  )
}

export default App
