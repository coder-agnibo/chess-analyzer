import { useState } from 'react';
import { getMovesListFromPGN, analyzeGame, saveMovesListToLocalStorage, getHashKeyfromMovesList, GetJSONCommentary, ChessMoveAnalysis, saveEngineAnalysisToLocalStorage, saveAIAnalysisToLocalStorage } from "../utils/chessUtil";
import { useNavigate } from 'react-router-dom';



function RenderMovesList(props: { movesList: Array<string> }) {
    if (props.movesList.length === 0) {
        return <div>Loading...</div>
    } else {
        return (
            <>
                <div className='grid grid-cols-2'>
                    {props.movesList.map((move, index) => <div className='inline-block'>{move}</div>)}
                </div>
            </>
        )
    }
}



function App() {
    const [pgn, setPgn] = useState("start");
    const [pgnHash, setPgnHash] = useState("");
    const [movesList, setMovesList] = useState<Array<string>>([]);
    const [engineData, setEngineData] = useState<Array<ChessMoveAnalysis>>([]);
    const [analysisProgress, setAnalysisProgress] = useState(0.0);
    const [isPgnLoaded, setIsPgnLoaded] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const navigate = useNavigate();

    return (
        <div className='flex flex-col'>
            <textarea name="txtarea" id="" cols="30" rows="10" placeholder='Enter PGN String here' onChange={(ev) => setPgn(ev.target.value)} value={pgn}></textarea>
            <div style={{ 'width': analysisProgress + '%' }} className='bg-gray-300 h-2'></div>

            <div className='mt-4'>
                {
                    !isPgnLoaded &&
                    <button onClick={async () => {
                        const mList = await getMovesListFromPGN(pgn);
                        setMovesList(mList);
                        setPgnHash(await getHashKeyfromMovesList(mList));
                        saveMovesListToLocalStorage(mList);
                        setIsPgnLoaded(true);
                        console.log("saveed to local storage");
                    }}>Load PGN</button>
                }

                {
                    isPgnLoaded && !isDone &&
                    <button onClick={async () => {
                        const data = await analyzeGame(movesList, setAnalysisProgress);
                        setEngineData(data);
                        saveEngineAnalysisToLocalStorage(pgnHash, data);
                        setIsDone(true);
                    }}>Engine Analysis</button>
                }

                {
                    isDone &&
                    <button onClick={async () => {
                        setIsAiLoading(true);
                        const aic = await GetJSONCommentary(engineData)
                        saveAIAnalysisToLocalStorage(pgnHash, aic);
                        setIsAiLoading(false);
                        navigate('/chessboard');
                    }}>
                        {isAiLoading ? "Loading..." : "AI Analysis"}
                    </button>
                }
            </div>

            <RenderMovesList movesList={movesList} />
        </div>
    )
}

export default App
