const chessboard = document.getElementById('chessboard');
let selectedPiece = null;
let currentPlayer = 'white';
let gameOver = false;

const initialBoard = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

function createBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            square.textContent = initialBoard[row][col];
            square.addEventListener('click', handleClick);
            chessboard.appendChild(square);
        }
    }
}

function handleClick(event) {
    if (gameOver) return;

    const clickedSquare = event.target;
    const row = parseInt(clickedSquare.dataset.row);
    const col = parseInt(clickedSquare.dataset.col);

    if (selectedPiece) {
        if (isValidMove(selectedPiece, clickedSquare)) {
            const move = movePiece(selectedPiece, clickedSquare);
            selectedPiece.classList.remove('selected');
            removeHighlights();
            selectedPiece = null;
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

            if (isCheck(currentPlayer)) {
                highlightCheck(currentPlayer);
                if (isCheckmate(currentPlayer)) {
                    highlightCheckmate(currentPlayer);
                    alert(`Checkmate! ${currentPlayer === 'white' ? 'Black' : 'White'} wins!`);
                    gameOver = true;
                } else {
                    alert(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
                }
            } else {
                removeCheckHighlight();
            }
        } else {
            selectedPiece.classList.remove('selected');
            removeHighlights();
            selectedPiece = null;
        }
    } else {
        if (clickedSquare.textContent && isPieceOfCurrentPlayer(clickedSquare.textContent)) {
            clickedSquare.classList.add('selected');
            selectedPiece = clickedSquare;
            highlightValidMoves(clickedSquare);
        }
    }
}

function isValidMove(from, to) {
    const fromPiece = from.textContent;
    const toPiece = to.textContent;
    const fromRow = parseInt(from.dataset.row);
    const fromCol = parseInt(from.dataset.col);
    const toRow = parseInt(to.dataset.row);
    const toCol = parseInt(to.dataset.col);

    // Prevent moving to a square occupied by a piece of the same color
    if (toPiece && isPieceOfCurrentPlayer(toPiece)) {
        return false;
    }

    // Check if the path is clear (for pieces that move in straight lines)
    if (!isPathClear(fromRow, fromCol, toRow, toCol)) {
        return false;
    }

    // Piece-specific movement rules
    switch (fromPiece) {
        case '♙': case '♟': return isValidPawnMove(fromRow, fromCol, toRow, toCol, fromPiece);
        case '♖': case '♜': return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case '♘': case '♞': return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case '♗': case '♝': return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case '♕': case '♛': return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case '♔': case '♚': return isValidKingMove(fromRow, fromCol, toRow, toCol);
        default: return false;
    }
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, piece) {
    const direction = piece === '♙' ? -1 : 1;
    const startRow = piece === '♙' ? 6 : 1;

    // Forward movement
    if (fromCol === toCol) {
        if (toRow === fromRow + direction && !getPieceAt(toRow, toCol)) {
            return true;
        }
        // First move can be two squares
        if (fromRow === startRow && toRow === fromRow + 2 * direction &&
            !getPieceAt(fromRow + direction, fromCol) && !getPieceAt(toRow, toCol)) {
            return true;
        }
    }
    // Diagonal capture
    if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && getPieceAt(toRow, toCol)) {
        return true;
    }
    return false;
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    return fromRow === toRow || fromCol === toCol;
}

function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    return Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol);
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return rowDiff <= 1 && colDiff <= 1;
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    let row = fromRow + rowStep;
    let col = fromCol + colStep;

    while (row !== toRow || col !== toCol) {
        if (getPieceAt(row, col)) {
            return false;
        }
        row += rowStep;
        col += colStep;
    }
    return true;
}

function getPieceAt(row, col) {
    return chessboard.children[8 * row + col].textContent;
}

function movePiece(from, to) {
    const piece = from.textContent;
    to.textContent = piece;
    from.textContent = '';

    // Check for pawn promotion
    if ((piece === '♙' && to.dataset.row === '0') || (piece === '♟' && to.dataset.row === '7')) {
        promotePawn(to);
    }
}

function promotePawn(square) {
    const promotionPieces = currentPlayer === 'white' ? ['♕', '♖', '♗', '♘'] : ['♛', '♜', '♝', '♞'];
    const choice = prompt('Choose a piece for pawn promotion: Q (Queen), R (Rook), B (Bishop), N (Knight)');
    switch (choice.toUpperCase()) {
        case 'Q':
            square.textContent = promotionPieces[0];
            break;
        case 'R':
            square.textContent = promotionPieces[1];
            break;
        case 'B':
            square.textContent = promotionPieces[2];
            break;
        case 'N':
            square.textContent = promotionPieces[3];
            break;
        default:
            square.textContent = promotionPieces[0]; // Default to Queen if invalid choice
    }
}

function isPieceOfCurrentPlayer(piece) {
    return (currentPlayer === 'white' && piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9817) ||
           (currentPlayer === 'black' && piece.charCodeAt(0) >= 9818 && piece.charCodeAt(0) <= 9823);
}

function highlightValidMoves(piece) {
    const row = parseInt(piece.dataset.row);
    const col = parseInt(piece.dataset.col);

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const targetSquare = chessboard.children[8 * r + c];
            if (isValidMove(piece, targetSquare)) {
                targetSquare.classList.add('highlight');
            }
        }
    }
}

function removeHighlights() {
    const squares = chessboard.getElementsByClassName('square');
    for (let square of squares) {
        square.classList.remove('highlight');
    }
}

function isCheck(player) {
    const kingPiece = player === 'white' ? '♔' : '♚';
    const kingSquare = findKing(kingPiece);
    const opponentColor = player === 'white' ? 'black' : 'white';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = chessboard.children[8 * r + c];
            if (piece.textContent && !isPieceOfCurrentPlayer(piece.textContent)) {
                if (isValidMove(piece, kingSquare)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function findKing(kingPiece) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = chessboard.children[8 * r + c];
            if (square.textContent === kingPiece) {
                return square;
            }
        }
    }
}

function isCheckmate(player) {
    const pieces = chessboard.getElementsByClassName('square');
    for (let piece of pieces) {
        if (piece.textContent && isPieceOfCurrentPlayer(piece.textContent)) {
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const targetSquare = chessboard.children[8 * r + c];
                    if (isValidMove(piece, targetSquare)) {
                        // Try the move
                        const originalPiece = piece.textContent;
                        const originalTarget = targetSquare.textContent;
                        movePiece(piece, targetSquare);
                        
                        // Check if the move gets out of check
                        const stillInCheck = isCheck(player);
                        
                        // Undo the move
                        piece.textContent = originalPiece;
                        targetSquare.textContent = originalTarget;
                        
                        if (!stillInCheck) {
                            return false; // Found a valid move to get out of check
                        }
                    }
                }
            }
        }
    }
    return true; // No valid moves to get out of check
}

function highlightCheck(player) {
    const kingPiece = player === 'white' ? '♔' : '♚';
    const kingSquare = findKing(kingPiece);
    kingSquare.classList.add('check');
}

function highlightCheckmate(player) {
    const kingPiece = player === 'white' ? '♔' : '♚';
    const kingSquare = findKing(kingPiece);
    kingSquare.classList.add('checkmate');
}

function removeCheckHighlight() {
    const squares = chessboard.getElementsByClassName('square');
    for (let square of squares) {
        square.classList.remove('check', 'checkmate');
    }
}

createBoard();