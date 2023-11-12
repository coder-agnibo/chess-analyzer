// Directly import the module (adjust the path according to your project structure)
import Stockfish from 'stockfish';

// Worker message handling
self.onmessage = function(e) {
    // Your worker logic here
    console.log(e)
};

self.onerror = function(e) { 
    console.error(e);
}

// Initialization and configuration of Stockfish
