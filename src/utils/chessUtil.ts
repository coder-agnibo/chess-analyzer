import { Chess } from 'chess.js';
// Depending on how stockfish.js is exposed, import might differ
import Stockfish from 'stockfish/src/stockfish-nnue-16.js?worker';
// import Stockfish from 'stockfish/src/stockfish-nnue-16-single.js?worker';


const stockfishWorker = new Stockfish();

import _ from 'lodash';

// var stockfish = STOCKFISH();

export const PGNString = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2023.11.11"]
[Round "?"]
[White "MATHEUSMA2014"]
[Black "ronniebasak22"]
[Result "0-1"]
[ECO "B01"]
[WhiteElo "483"]
[BlackElo "420"]
[TimeControl "900+10"]
[EndTime "12:06:31 PST"]
[Termination "ronniebasak22 won by checkmate"]

1. e4 d5 2. Bb5+ Bd7 3. Nc3 c6 4. Bd3 Nf6 5. exd5 cxd5 6. Nf3 Bg4 7. O-O e5 8.
Qe1 Nbd7 9. Nxe5 Nxe5 10. Qxe5+ Be7 11. Bf5 O-O 12. Bxg4 Nxg4 13. Qxd5 Bb4 14.
Qxd8 Raxd8 15. d3 Bxc3 16. bxc3 Rfe8 17. Bg5 Rd5 18. c4 Rxg5 19. f3 Ne3 20. Rf2
Nxc2 21. Rc1 Rge5 22. Kf1 Re1+ 23. Rxe1 Rxe1# 0-1`



export function getMovesListFromPGN() {
    stockfishWorker.onmessage = (e) => {
        // Handle messages from the worker
        console.log(e)
    };
    console.log("WWWW", stockfishWorker)

    // Sending messages to the worker
    stockfishWorker.postMessage('uci');
    
    // stockfishWorker.postMessage('isready');
    
    
    


    const chess = new Chess();
    chess.loadPgn(PGNString);
    const movesHistory = _.cloneDeep(chess.history());
    return movesHistory;
}


export function playMove(move: string, startFen: string | undefined): string {
    const chess = new Chess(startFen);
    chess.move(move);
    return chess.fen();
}

// export function getEvaluation(fen: string) {
//     engine.position(fen);
// }


// const engine = new Stockfish();



