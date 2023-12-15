import { Chess } from 'chess.js';
// Depending on how stockfish.js is exposed, import might differ
import Stockfish from 'stockfish/src/stockfish-nnue-16.js?worker';
import { UCIWrapper, UCIScore } from "./uciEngine";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: '<YOUR_OPENAI_API_KEY_HERE>', dangerouslyAllowBrowser: true });

declare global {
  interface Window {
    stockfish: typeof Stockfish;
  }
}

const stockfishWorker = new Stockfish();

import _ from 'lodash';

// var stockfish = STOCKFISH();
export interface ChessMoveAnalysis {
  move_no: number;
  move: string;
  evaluation: string;
  top3_engine_lines: string[][];
  is_best_move: boolean;
  is_top3_moves: boolean;
  opening: string;
  fen: string;
}

export interface AIAnalysis {
  remark: string;
  classification: string;
  alternative_with_explanation: string;
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


export async function GetJSONCommentary(analyzedMoveList: ChessMoveAnalysis[]) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are Agnis, a helpful and fun Chess Review Coach. Specialize in turn-by-turn analysis, from the POV provided, you have access to engine moves.\n\nYou have a fun and edgy personality, you comment on silly mistakes and oversights and make fun of them. \n\nExpect this JSON Input:\n[{\"move_no\": 1,\"move\": \"e4\",\"evaluation\": \"+0.37\",\"top3_engine_lines\": [\"e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nc3 Bb4\",\"c5 Nf3 Nc6 d4 cxd4 Nxd4 e5 Nb3 Nf6 Bg5\",\"e6 d4 d5 Nc3 Bb4 Qg4 Kf8 Bg5 Nf6 Qg3 dxe4 O-O-O Bxc3\"],\"opening\": \"King's Pawn Game\" }]\n\nProvide feedback on every single move, not just on entire turns, keep in mind the POV and ELO at all times.\n\nFor example, if the game is e4 e5 Nf3 Nc6 d5, the review can be as follows:\n\n1. e4 - Kings Pawn Opening\n2. e5 - e5 is a solid choice\n3. Nf3 - King's Knight variation attacks the pawn in e5 and black now has to defend it\n4. Nc3 - Black defends the pawn while also developing its own piece\n\noutput a JSON object with the following the structure\n\n{\"move_list: [{\"remark\": \"...\", \"classification\": \"...\", \"alternative_with_explanation\": \"...\"} ]}\n\nclassification can be one of the following: book, opening, best, excellent, good, inaccurate, miss, blunder",
      },
      { role: "user", content: `${JSON.stringify(analyzedMoveList)}\n---\nReview from Black's POV, adhere to the JSON structure` },
    ],
    model: "gpt-4-1106-preview",
    response_format: { type: "json_object" },
    max_tokens: 4095,
    seed: 31452,
    top_p: 0.3,
    frequency_penalty: 0,
    presence_penalty: -1.0
  });


  const parsedResp = JSON.parse(completion.choices[0].message.content || "{}");
  return parsedResp['move_list'];
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
    return ((score.value / 100) * (turn === 'w' ? -1 : 1)).toString();
  }
  if (score.type == 'mate' && score.value) {
    return (turn === 'w' ? '+M' : '-M') + score.value.toString();
  }
  return "";
}


export async function getMovesListFromPGN(pgn) {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const movesHistory = _.cloneDeep(chess.history());
  return movesHistory;
}


export function playMove(move: string, startFen: string | undefined): string {
  const chess = new Chess(startFen);
  chess.move(move);
  return chess.fen();
}

export async function getHashKeyfromMovesList(movesList: string[]) {
  const moveStr = movesList.join(' ');

  // sha256 the movestr
  const encoder = new TextEncoder();
  const data = encoder.encode(moveStr);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;

}


function getDataFromLS(db: string, hash: string) {
  const localMoveStr = localStorage.getItem(db);
  const localMoveStrObj = localMoveStr ? JSON.parse(localMoveStr) : {};
  return localMoveStrObj[hash];
}

export async function saveMovesListToLocalStorage(movesList: string[]) {
  const hashHex = await getHashKeyfromMovesList(movesList);

  const localMoveStr = localStorage.getItem("gamesDB");
  const localMoveStrObj = localMoveStr ? JSON.parse(localMoveStr) : {};
  localMoveStrObj[hashHex] = movesList;
  localStorage.setItem("gamesDB", JSON.stringify(localMoveStrObj));
}

export function getGameFromHash(hash: string) {
  return getDataFromLS("gamesDB", hash);
}


export async function saveEngineAnalysisToLocalStorage(hash: string, analysis: ChessMoveAnalysis[]) {
  const localMoveStr = localStorage.getItem("AnalysisDB");
  const localMoveStrObj = localMoveStr ? JSON.parse(localMoveStr) : {};
  localMoveStrObj[hash] = analysis;
  localStorage.setItem("AnalysisDB", JSON.stringify(localMoveStrObj));
}

export function getEngineAnalysisFromHash(hash: string) {
  return getDataFromLS("AnalysisDB", hash);
}

export async function saveAIAnalysisToLocalStorage(hash: string, analysis: object[]) {
  const localMoveStr = localStorage.getItem("AIAnalysisDB");
  const localMoveStrObj = localMoveStr ? JSON.parse(localMoveStr) : {};
  localMoveStrObj[hash] = analysis;
  localStorage.setItem("AIAnalysisDB", JSON.stringify(localMoveStrObj));
}

export function getAIAnalysisFromHash(hash: string) {
  return getDataFromLS("AIAnalysisDB", hash);
}



export async function analyzeGame(movesList: string[], progressCallback: Function | undefined) {
  // const movesList = await getMovesListFromPGN(PGNString as string);

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
    const fen = chess.fen();

    if (chess.isGameOver()) {
      analysedMoves.push({
        move_no: parseInt(movei) + 1,
        move: move,
        evaluation: "0",
        top3_engine_lines: [],
        is_best_move: true,
        is_top3_moves: true,
        fen: chess.fen(),
        opening: ""//chess.pgn().split('\n')[0].split('"')[1]
      })
      break;
    }


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
      opening: "",
      fen: fen
    })


    if (progressCallback) {
      progressCallback(analysedMoves.length / uciMoves.length * 100);
    }
    // console.log(fen)
  }
  console.log(analysedMoves);
  return analysedMoves;
  // }

}