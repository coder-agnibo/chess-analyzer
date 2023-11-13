type AnalysisResult = {
    pvs: string[];
    evaluation: number;
};

export class UCIWrapper {
    private worker: Worker;
    private defaultTimeout: number;
    private defaultDepth: number;

    constructor(worker: Worker) {
        this.worker = worker;
        this.defaultTimeout = 5000; // default timeout in milliseconds
        this.defaultDepth = 5; // default depth for analysis

        // Attach an event listener to handle incoming messages from the worker
        this.worker.onmessage = this.handleMessage.bind(this);
    }

    // Send a command to the engine
    private sendCommand(command: string): void {
        this.worker.postMessage(command);
    }

    // Handle messages received from the engine
    private handleMessage(message: MessageEvent): void {
        // Process the message from the engine
        // You might need to implement a more complex message handling logic based on your needs
        console.log(message.data);
    }

    // Initialize the engine
    public init(): void {
        this.sendCommand('uci');
    }

    // Reset the engine to prepare for a new game
    public reset(): void {
        this.sendCommand('ucinewgame');
    }

    // Set the position on the engine
    public setPosition(fen: string): void {
        this.sendCommand(`position fen ${fen}`);
    }

    // Analyze the current position
    public analyze({ timeout = this.defaultTimeout, depth = this.defaultDepth } = {}): Promise<AnalysisResult> {
        return new Promise((resolve, reject) => {
            // Set up the analysis parameters
            const analysisParams = `go depth ${depth}`;
            this.sendCommand(analysisParams);

            // Set a timeout to stop the analysis after the given time
            const timer = setTimeout(() => {
                this.sendCommand('stop');
            }, timeout);

            // Listen for the bestmove command which indicates the end of the analysis
            this.worker.onmessage = (message: MessageEvent) => {
                if (message.data.startsWith('bestmove')) {
                    clearTimeout(timer);
                    resolve(this.parseAnalysisResult(message.data));
                }
            };
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
