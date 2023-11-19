import { Chess } from 'chess.js';
// Depending on how stockfish.js is exposed, import might differ
import Stockfish from 'stockfish/src/stockfish-nnue-16.js?worker';
import { UCIWrapper, UCIScore } from "./uciEngine";
import { timeout } from "./timeout";

declare global {
  interface Window {
    stockfish: typeof Stockfish;
  }
}

const stockfishWorker = new Stockfish();

import _ from 'lodash';

// var stockfish = STOCKFISH();
interface ChessMoveAnalysis {
  move_no: number;
  move: string;
  evaluation: string;
  top3_engine_lines: string[][];
  is_best_move: boolean;
  is_top3_moves: boolean;
  opening: string;
  fen: string;
}

function UCItoSAN(uciMoves: string[], fen?: string): string[] {
  const chess = new Chess(fen); // Initialize with FEN if provided
  const sanMoves: string[] = [];
  for (let uciMove of uciMoves) {
    const move = chess.move({ from: uciMove.substring(0, 2), to: uciMove.substring(2, 4), promotion: uciMove[4] });
    if (move === null) {
      throw new Error('Invalid UCI move');
    }
    sanMoves.push(move.san);
  }
  return sanMoves; // The move object contains the SAN notation
}


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

function SANtoUCI(sanMoves: string[]) {
  const chess = new Chess();
  const uciMoves: string[] = [];

  for (let sanMove of sanMoves) {
    const moveObj = chess.move(sanMove);
    if (moveObj === null) {
      throw new Error('Invalid SAN move');
    }
    let uciMove = moveObj.from + moveObj.to;
    if (moveObj.promotion) {
      uciMove += moveObj.promotion;
    }
    uciMoves.push(uciMove)
  }

  return uciMoves;
}

function getAboluteScore(score: UCIScore, turn: 'w' | 'b'): string {
  // debugger;
  if (score.type == 'cp' && score.value) {
    return ((score.value/100) * (turn === 'w' ? -1 : 1)).toString();
  }
  if (score.type == 'mate' && score.value) {
    return (turn === 'w' ? '+M' : '-M') + score.value.toString();
  }
  return "";
}


export async function getMovesListFromPGN() {
  const chess = new Chess();
  chess.loadPgn(PGNString);
  const movesHistory = _.cloneDeep(chess.history());
  console.log(movesHistory)
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



export async function analyzeGame() {
  const movesList = await getMovesListFromPGN(PGNString as string);

  const sampleOutput: ChessMoveAnalysis = {
    "move_no": 1,
    "move": "e4",
    "evaluation": "+0.37",
    "top3_engine_lines": [
      "e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nc3 Bb4",
      "c5 Nf3 Nc6 d4 cxd4 Nxd4 e5 Nb3 Nf6 Bg5",
      "e6 d4 d5 Nc3 Bb4 Qg4 Kf8 Bg5 Nf6 Qg3 dxe4 O-O-O Bxc3"
    ],
    "is_best_move": false,
    "is_top3_moves": false,
    "opening": "King's Pawn Game"
  }
  // await uci.wait_for_readyok();

  const chess = new Chess();
  const uci = new UCIWrapper(stockfishWorker);
  await uci.init();

  window.uci = uci;
  window.stockfish = stockfishWorker;
  uci.sendCommand("setoption name ponder value false");
  uci.setDefaultOptions();
  const uciMoves = SANtoUCI(movesList);

  console.log(uciMoves);
  // alert("Hi")
  uci.setPosition('startpos');
  // await uci.wait_for_readyok();
  // alert("hello")

  const analysedMoves: ChessMoveAnalysis[] = [];
  let prev_top3_moves: string[] = [];

  for (let movei in uciMoves) {
    const move = movesList[movei];
    const uciMove = uciMoves[movei];
    const turn = chess.turn();

    chess.move(move);

    if (chess.isGameOver()) {
      analysedMoves.push({
        move_no: parseInt(movei) + 1,
        move: move,
        evaluation: "0",
        top3_engine_lines: [],
        is_best_move: true,
        is_top3_moves: true,
        turn: chess.turn(),
        opening: ""//chess.pgn().split('\n')[0].split('"')[1]
      })
      break;
    }
    const fen = chess.fen();


    uci.sendCommand(`position fen ${fen} moves ${uciMove}`);
    // await uci.wait_for_readyok();

    const response = await uci.analyze({ depth: 10 });
    console.log(response);

    const top3_engine_lines = response.pvs.map(pv => pv.pv).map(pv => UCItoSAN(pv, fen));

    prev_top3_moves = top3_engine_lines.map(pv => pv[0]);

    analysedMoves.push({
      move_no: parseInt(movei) + 1,
      move: move,
      evaluation: getAboluteScore(response.pvs[0].score, turn),
      top3_engine_lines: top3_engine_lines,
      is_best_move: prev_top3_moves[0] === move,
      is_top3_moves: prev_top3_moves.includes(move),
      opening: "",//chess.pgn().split('\n')[0].split('"')[1]
      fen: fen
    })

    // console.log(fen)
  }
  console.log(analysedMoves);
  return analysedMoves;
  // }

}