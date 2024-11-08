const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const gameStatusElement = document.getElementById("game-status");
const restartButton = document.getElementById("restart-button");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let validMoves = [];

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            const squarePosition = `${String.fromCharCode(97 + squareIndex)}${8 - rowIndex}`;
            if (validMoves.includes(squarePosition)) {
                squareElement.classList.add("highlight");
            }
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerHTML = getPieceUnicode(square);
                pieceElement.draggable = (playerRole === 'W' && square.color === 'w') || (playerRole === 'B' && square.color === 'b');
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                        highlightValidMoves(`${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`);
                    }
                });
                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                    validMoves = [];
                    renderBoard();
                });
                squareElement.appendChild(pieceElement);
            }
            squareElement.addEventListener("dragover", (e) => e.preventDefault());
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });
};

const highlightValidMoves = (sourceSquare) => {
    const moves = chess.moves({ square: sourceSquare, verbose: true });
    validMoves = moves.map(move => move.to);
    renderBoard();
};

const handleMove = (source, target) => {
    if (!source || !target || source.col === undefined || source.row === undefined || target.col === undefined || target.row === undefined) {
        console.error("Source or target position is not defined correctly");
        return;
    }
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"
    };
    console.log("Emitting move:", move);
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePiece = {
        k: "&#9818;", q: "&#9819;", r: "&#9820;", b: "&#9821;", n: "&#9822;", p: "&#9823;",
        K: "&#9812;", Q: "&#9813;", R: "&#9814;", B: "&#9815;", N: "&#9816;", P: "&#9817;"
    };
    return unicodePiece[piece.type] || "";
};

const updateGameStatus = () => {
    if (chess.in_checkmate()) {
        gameStatusElement.innerText = `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
    } else if (chess.in_draw()) {
        gameStatusElement.innerText = 'Draw!';
    } else if (chess.in_stalemate()) {
        gameStatusElement.innerText = 'Stalemate!';
    } else if (chess.in_check()) {
        gameStatusElement.innerText = `${chess.turn() === 'w' ? 'White' : 'Black'} is in check!`;
    } else {
        gameStatusElement.innerText = `${chess.turn() === 'w' ? 'White' : 'Black'} to move.`;
    }
};

restartButton.addEventListener("click", () => {
    socket.emit("restart");
});

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    updateGameStatus();
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    updateGameStatus();
    renderBoard();
});

socket.on("restart", () => {
    chess.reset();
    updateGameStatus();
    renderBoard();
});

renderBoard();
updateGameStatus();
