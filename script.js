// ============ ESTRUTURAS DE DADOS ============

// 1. ÁRVORE (Nó da árvore Minimax)
class TreeNode {
    constructor(board, move = null, depth = 0) {
        this.board = board;
        this.move = move;
        this.depth = depth;
        this.children = [];
        this.value = null;
        this.isTerminal = false;
    }
    
    addChild(child) {
        this.children.push(child);
    }
    
    isLeaf() {
        return this.children.length === 0;
    }
}

// 2. LISTA ORDENADA para Ranking (com MergeSort)
class SortedList {
    constructor() {
        this.items = [];
    }
    
    // Inserir mantendo ordem
    insert(item) {
        const index = this.findInsertPosition(item);
        this.items.splice(index, 0, item);
    }
    
    findInsertPosition(item) {
        let left = 0;
        let right = this.items.length;
        
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (this.items[mid].score > item.score) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        return left;
    }
    
    // MergeSort para ordenação completa
    mergeSort(arr = this.items) {
        if (arr.length <= 1) return arr;
        
        const mid = Math.floor(arr.length / 2);
        const left = this.mergeSort(arr.slice(0, mid));
        const right = this.mergeSort(arr.slice(mid));
        
        return this.merge(left, right);
    }
    
    merge(left, right) {
        const result = [];
        let i = 0, j = 0;
        
        while (i < left.length && j < right.length) {
            if (left[i].score >= right[j].score) {
                result.push(left[i]);
                i++;
            } else {
                result.push(right[j]);
                j++;
            }
        }
        
        return result.concat(left.slice(i)).concat(right.slice(j));
    }
    
    getTop(n = 5) {
        return this.items.slice(0, n);
    }
    
    update(name, score) {
        const existing = this.items.find(item => item.name === name);
        if (existing) {
            existing.score = score;
            this.items = this.mergeSort();
        } else {
            this.insert({ name, score });
        }
    }
}

// ============ VARIÁVEIS GLOBAIS ============

const ROWS = 6;
const COLS = 7;
const PLAYER = 1;
const AI = 2;
const EMPTY = 0;

let board = [];
let currentPlayer = PLAYER;
let gameOver = false;
let difficulty = 4;
let movesAnalyzed = 0;

// Estatísticas
let stats = {
    playerWins: 0,
    aiWins: 0,
    draws: 0
};

// Ranking usando nossa lista ordenada
const ranking = new SortedList();
ranking.insert({ name: "IA Minimax", score: 0 });
ranking.insert({ name: "Jogador Humano", score: 0 });

// ============ INICIALIZAÇÃO ============

function initGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
    currentPlayer = PLAYER;
    gameOver = false;
    movesAnalyzed = 0;
    createBoard();
    updateStatus("Sua vez! Clique em uma coluna");
    updateStats();
}

function createBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell empty';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(col));
            boardElement.appendChild(cell);
        }
    }
}

// ============ LÓGICA DO JOGO ============

function handleCellClick(col) {
    if (gameOver || currentPlayer !== PLAYER) return;
    
    if (makeMove(col, PLAYER)) {
        updateBoard();
        
        if (checkWin(board, PLAYER)) {
            endGame("🎉 Você venceu!", PLAYER);
        } else if (isBoardFull(board)) {
            endGame("⚖️ Empate!", null);
        } else {
            currentPlayer = AI;
            updateStatus('<span class="ai-thinking">🤖 IA pensando...</span>');
            
            // Delay para mostrar que a IA está "pensando"
            setTimeout(() => {
                aiMove();
            }, 500);
        }
    }
}

function makeMove(col, player) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === EMPTY) {
            board[row][col] = player;
            return true;
        }
    }
    return false;
}

function aiMove() {
    const startTime = performance.now();
    movesAnalyzed = 0;
    
    // Criar nó raiz da árvore
    const rootNode = new TreeNode(copyBoard(board));
    
    // Executar Minimax
    const bestMove = minimax(rootNode, difficulty, true);
    
    const endTime = performance.now();
    console.log(`IA analisou ${movesAnalyzed} jogadas em ${(endTime - startTime).toFixed(2)}ms`);
    
    if (bestMove !== null && makeMove(bestMove, AI)) {
        updateBoard();
        
        if (checkWin(board, AI)) {
            endGame("🤖 IA venceu!", AI);
        } else if (isBoardFull(board)) {
            endGame("⚖️ Empate!", null);
        } else {
            currentPlayer = PLAYER;
            updateStatus("Sua vez! Clique em uma coluna");
        }
    }
    
    updateStats();
}

// ============ ALGORITMO MINIMAX ============

function minimax(node, depth, isMaximizing) {
    movesAnalyzed++;
    
    // Condições de parada
    if (depth === 0 || checkWin(node.board, AI) || checkWin(node.board, PLAYER) || isBoardFull(node.board)) {
        return evaluateBoard(node.board);
    }
    
    const player = isMaximizing ? AI : PLAYER;
    let bestValue = isMaximizing ? -Infinity : Infinity;
    let bestMove = null;
    
    // Gerar filhos (jogadas possíveis)
    for (let col = 0; col < COLS; col++) {
        if (isValidMove(node.board, col)) {
            const newBoard = copyBoard(node.board);
            
            // Fazer jogada
            for (let row = ROWS - 1; row >= 0; row--) {
                if (newBoard[row][col] === EMPTY) {
                    newBoard[row][col] = player;
                    break;
                }
            }
            
            // Criar nó filho
            const childNode = new TreeNode(newBoard, col, node.depth + 1);
            node.addChild(childNode);
            
            // Recursão
            const value = minimax(childNode, depth - 1, !isMaximizing);
            
            if (isMaximizing) {
                if (value > bestValue) {
                    bestValue = value;
                    bestMove = col;
                }
            } else {
                if (value < bestValue) {
                    bestValue = value;
                    bestMove = col;
                }
            }
        }
    }
    
    // Se estamos na raiz, retornar a melhor jogada
    if (node.depth === 0) {
        return bestMove;
    }
    
    return bestValue;
}

// Função de avaliação heurística
function evaluateBoard(board) {
    if (checkWin(board, AI)) return 1000;
    if (checkWin(board, PLAYER)) return -1000;
    if (isBoardFull(board)) return 0;
    
    let score = 0;
    
    // Avaliar todas as sequências possíveis de 4
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            // Horizontal
            if (col <= COLS - 4) {
                score += evaluateSequence(board, row, col, 0, 1);
            }
            // Vertical
            if (row <= ROWS - 4) {
                score += evaluateSequence(board, row, col, 1, 0);
            }
            // Diagonal \
            if (row <= ROWS - 4 && col <= COLS - 4) {
                score += evaluateSequence(board, row, col, 1, 1);
            }
            // Diagonal /
            if (row >= 3 && col <= COLS - 4) {
                score += evaluateSequence(board, row, col, -1, 1);
            }
        }
    }
    
    return score;
}

function evaluateSequence(board, row, col, deltaRow, deltaCol) {
    let aiCount = 0;
    let playerCount = 0;
    
    for (let i = 0; i < 4; i++) {
        const r = row + i * deltaRow;
        const c = col + i * deltaCol;
        
        if (board[r][c] === AI) aiCount++;
        else if (board[r][c] === PLAYER) playerCount++;
    }
    
    // Se ambos jogadores têm peças na sequência, não vale nada
    if (aiCount > 0 && playerCount > 0) return 0;
    
    // Pontuação baseada no número de peças
    if (aiCount === 4) return 1000;
    if (aiCount === 3) return 100;
    if (aiCount === 2) return 10;
    if (aiCount === 1) return 1;
    
    if (playerCount === 4) return -1000;
    if (playerCount === 3) return -100;
    if (playerCount === 2) return -10;
    if (playerCount === 1) return -1;
    
    return 0;
}

// ============ FUNÇÕES AUXILIARES ============

function checkWin(board, player) {
    // Verificar todas as direções possíveis
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] === player) {
                // Horizontal
                if (col <= COLS - 4 && 
                    board[row][col + 1] === player &&
                    board[row][col + 2] === player &&
                    board[row][col + 3] === player) {
                    highlightWinningCells([[row, col], [row, col + 1], [row, col + 2], [row, col + 3]]);
                    return true;
                }
                
                // Vertical
                if (row <= ROWS - 4 &&
                    board[row + 1][col] === player &&
                    board[row + 2][col] === player &&
                    board[row + 3][col] === player) {
                    highlightWinningCells([[row, col], [row + 1, col], [row + 2, col], [row + 3, col]]);
                    return true;
                }
                
                // Diagonal \
                if (row <= ROWS - 4 && col <= COLS - 4 &&
                    board[row + 1][col + 1] === player &&
                    board[row + 2][col + 2] === player &&
                    board[row + 3][col + 3] === player) {
                    highlightWinningCells([[row, col], [row + 1, col + 1], [row + 2, col + 2], [row + 3, col + 3]]);
                    return true;
                }
                
                // Diagonal /
                if (row >= 3 && col <= COLS - 4 &&
                    board[row - 1][col + 1] === player &&
                    board[row - 2][col + 2] === player &&
                    board[row - 3][col + 3] === player) {
                    highlightWinningCells([[row, col], [row - 1, col + 1], [row - 2, col + 2], [row - 3, col + 3]]);
                    return true;
                }
            }
        }
    }
    return false;
}

function highlightWinningCells(cells) {
    cells.forEach(([row, col]) => {
        const index = row * COLS + col;
        const cell = document.getElementById('board').children[index];
        cell.classList.add('winner-highlight');
    });
}

function isBoardFull(board) {
    return board[0].every(cell => cell !== EMPTY);
}

function isValidMove(board, col) {
    return board[0][col] === EMPTY;
}

function copyBoard(board) {
    return board.map(row => [...row]);
}

function updateBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const index = row * COLS + col;
            const cell = document.getElementById('board').children[index];
            
            cell.className = 'cell';
            if (board[row][col] === PLAYER) {
                cell.classList.add('player1');
                cell.textContent = '🔴';
            } else if (board[row][col] === AI) {
                cell.classList.add('player2');
                cell.textContent = '🔵';
            } else {
                cell.classList.add('empty');
                cell.textContent = '';
            }
        }
    }
}

function updateStatus(message) {
    document.getElementById('status').innerHTML = message;
}

function endGame(message, winner) {
    gameOver = true;
    updateStatus(message);
    
    // Atualizar estatísticas
    if (winner === PLAYER) {
        stats.playerWins++;
        updateRanking("Jogador Humano", 3);
    } else if (winner === AI) {
        stats.aiWins++;
        updateRanking("IA Minimax", 3);
    } else {
        stats.draws++;
        updateRanking("Jogador Humano", 1);
        updateRanking("IA Minimax", 1);
    }
    
    updateStats();
}

function updateRanking(playerName, points) {
    const current = ranking.items.find(item => item.name === playerName);
    if (current) {
        current.score += points;
    }
    
    // Reordenar usando MergeSort
    ranking.items = ranking.mergeSort();
    
    // Atualizar display
    document.getElementById('aiScore').textContent = 
        ranking.items.find(item => item.name === "IA Minimax").score + " pts";
    document.getElementById('playerScore').textContent = 
        ranking.items.find(item => item.name === "Jogador Humano").score + " pts";
}

function updateStats() {
    document.getElementById('playerWins').textContent = stats.playerWins;
    document.getElementById('aiWins').textContent = stats.aiWins;
    document.getElementById('draws').textContent = stats.draws;
    document.getElementById('movesAnalyzed').textContent = movesAnalyzed;
}

function resetGame() {
    initGame();
}

// Event listeners
document.getElementById('difficulty').addEventListener('change', function() {
    difficulty = parseInt(this.value);
});

// Inicializar jogo
initGame();