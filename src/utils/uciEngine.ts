import { timeout as timeoutFn } from "./timeout";


type AnalysisResult = {
    pvs: string[];
    evaluation: number;
};



export interface UCIOutput {
    depth: number;
    seldepth: number;
    multipv: number;
    score: UCIScore; // Keeping it simple as a string. You can create a more complex structure if needed.
    nodes: number;
    nps: number;
    time: number;
    pv: string[];
}

export interface UCIScore {
    type: 'cp' | 'mate';
    value: number;
    lowerbound: boolean;
    upperbound: boolean;
}


export class UCIWrapper {
    private worker: Worker;
    private defaultTimeout: number;
    private defaultDepth: number;
    public uciok: boolean;
    private lock: boolean = false;
    private callbackfn: Function | undefined = () => { };
    private multipv_n: number = 3;

    constructor(worker: Worker) {
        this.worker = worker;
        this.defaultTimeout = 5000; // default timeout in milliseconds
        this.defaultDepth = 5; // default depth for analysis
        this.uciok = false;

        worker.onmessage = this.handleMessage.bind(this);
    }

    // Send a command to the engine
    public sendCommand(command: string): void {
        console.log("DEBUG SEND:", command);
        if(command == "isready") {
            console.log("STOCKFISH DEBUG READY")
        }
        if (!this.uciok && command != "uci" && command != "isready") {
            return;
        }
        this.worker.postMessage(command);
    }

    private parseScore(scoreString: string): UCIScore {
        const score: UCIScore = { type: 'cp', value: 0, lowerbound: false, upperbound: false };
        const parts = scoreString.split(' ');

        for (let i = 0; i < parts.length; i++) {
            switch (parts[i]) {
                case 'cp':
                    score.type = 'cp';
                    score.value = parseInt(parts[++i], 10);
                    break;
                case 'mate':
                    score.type = 'mate';
                    score.value = parseInt(parts[++i], 10);
                    break;
                case 'lowerbound':
                    score.lowerbound = true;
                    break;
                case 'upperbound':
                    score.upperbound = true;
                    break;
            }
        }

        return score as UCIScore;
    }

    private parseUCIOutput(uciString: string): UCIOutput {
        const tokens = uciString.split(' ');
        const infoObject: Partial<UCIOutput> = {};
        let key: keyof UCIOutput | '' = '';
        let value: UCIScore | number | string | undefined = undefined;
        let isPv: boolean = false;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            let toBreak: boolean = false;

            if (token === 'depth' || token === 'seldepth' || token === 'multipv' ||
                token === 'nodes' || token === 'nps' || token === 'time') {
                key = token;
                value = parseInt(tokens[++i], 10);
            } else if (token === 'score') {
                key = token;
                value = tokens[++i]; // 'cp' or 'mate'
                value += ' ' + tokens[++i]; // score value
                value = this.parseScore(value as string);
            } else if (token === 'pv') {
                key = token;
                isPv = true
                value = tokens.slice(++i).join(' ');
                toBreak = true;
            } else {
                continue;
            }

            if (key && value !== undefined) {
                if (key === 'pv') {
                    infoObject[key] = (value as string).split(' ');
                } else {
                    // ts-ignore
                    infoObject[key] = value || "";
                }
            }

            if (toBreak) {
                break;
            }
        }

        return infoObject as UCIOutput;
    }




    // Handle messages received from the engine
    private handleMessage(message: MessageEvent): void {
        // Process the message from the engine
        console.log("DEBUG DATA: ", message.data);

        if (message.data == "uciok") {
            this.uciok = true;
        }

        if (this.lock && this.callbackfn) {
            this.callbackfn(message.data);
        }
    }

    // Initialize the engine
    public init(): Promise<boolean> {
        return new Promise((resolve, _) => {
            if (!this.lock) {
                this.lock = true;
                this.sendCommand('uci');

                this.callbackfn = (data: string) => {
                    if (data == "uciok") {
                        this.lock = false;
                        this.callbackfn = undefined;
                        resolve(true);
                    }
                }
            }

            else resolve(false);
        });
    }

    public wait_for_readyok(): Promise<boolean> {
        return new Promise((resolve, _) => {
            if (!this.lock) {
                this.lock = true;
                this.sendCommand("isready");
                this.callbackfn = (data: string) => {
                    if (data == "readyok") {
                        this.lock = false;
                        this.callbackfn = undefined
                        resolve(true);
                        return;
                    }
                    resolve(false);
                    return;
                }
            }
        });
    }

    public set NNUE(value: boolean) {
        this.sendCommand(`setoption name Use NNUE value ${value}`);
    }

    public set Threads(value: number) {
        this.sendCommand(`setoption name Threads value ${value}`);
    }

    public set Hash(value: number) {
        this.sendCommand(`setoption name Hash value ${value}`);
    }

    public set UCI_Elo(value: number) {
        this.sendCommand(`setoption name UCI_Elo value ${value}`);
    }

    public set UCI_AnalyseMode(value: boolean) {
        this.sendCommand(`setoption name UCI_AnalyseMode value ${value}`);
    }

    public set UCI_ShowWDL(value: boolean) {
        this.sendCommand(`setoption name UCI_ShowWDL value ${value}`);
    }

    public set multipv(value: number) {
        this.multipv_n = value;
        this.sendCommand(`setoption name multipv value ${value}`);
    }


    public async setDefaultOptions(): Promise<boolean> {
        this.NNUE = true;

        // await this.wait_for_readyok();
        this.Threads = 8;
        // await this.wait_for_readyok();
        this.Hash = 16;
        // await this.wait_for_readyok();
        this.UCI_Elo = 3190;
        // await this.wait_for_readyok();
        this.UCI_AnalyseMode = true;
        // await this.wait_for_readyok();
        this.UCI_ShowWDL = true;
        // await this.wait_for_readyok();
        this.multipv = 3;
        await this.wait_for_readyok();
        return true;
    }
    // Reset the engine to prepare for a new game
    public reset(): void {
        this.sendCommand('ucinewgame');
    }

    // Set the position on the engine
    public setPosition(fen: string): void {
        if (fen == "startpos") {
            // this.sendCommand("position startpos");
            this.sendCommand("ucinewgame");
            return;
        }
        this.sendCommand(`position fen ${fen}`);
    }

    // Analyze the current position
    public analyze({ timeout = this.defaultTimeout, depth = this.defaultDepth } = {}): Promise<{pvs: UCIOutput[], bestmove: string}> {
        return new Promise(async (resolve, _) => {
            let returnValue: { pvs: UCIOutput[], bestmove: string } = {
                pvs: [],
                bestmove: ""
            };
            let variations: UCIOutput[] = [];

            while (this.lock) {
                await timeoutFn(20);
            }
            if (!this.lock) {
                // Set up the analysis parameters
                this.lock = true;

                const analysisParams = `go depth ${depth}`;
                this.sendCommand(analysisParams);

                // Set a timeout to stop the analysis after the given time
                const timer = setTimeout(() => {
                    this.sendCommand('stop');
                }, timeout);

                // Process the analysis result
                this.callbackfn = (data: string) => {
                    if (data.startsWith('info') && data.includes('depth')) {
                        const result = this.parseUCIOutput(data);
                        if (result.depth === depth) {
                            const i = variations.length;
                            variations[i] = result;
                        }
                    }
                    else if (data.startsWith('bestmove')) {
                        clearTimeout(timer);
                        this.lock = false;
                        this.callbackfn = undefined;

                        returnValue.pvs = variations;
                        returnValue.bestmove = data.split(' ')[1];
                        resolve(returnValue);
                    }
                }
            }
        });
    }

    // Parse the analysis result to extract principal variations and evaluation
    private parseAnalysisResult(data: string): AnalysisResult {
        // This should be adjusted based on the engine's output format
        const pvs = data.match(/pv\s(\S+)/g)?.slice(0, 3).map(pv => pv.replace('pv ', '')) ?? [];
        const evaluationMatch = data.match(/score cp (\S+)/);
        const evaluation = evaluationMatch ? parseInt(evaluationMatch[1], 10) / 100 : 0; // convert centipawns to pawns
        return {
            pvs,
            evaluation
        };
    }
}

// // Usage example:
// const myWorker = new Worker('path_to_your_chess_engine_worker.js');
// const uci = new UCIWrapper(myWorker);

// uci.init();
// uci.reset();
// uci.setPosition('startpos'); // Or use a FEN string for a specific position
// uci.analyze().then(result => {
//     console.log('Top principal variations:', result.pvs);
//     console.log('Evaluation:', result.evaluation);
// });
