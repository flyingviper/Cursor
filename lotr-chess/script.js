// LOTR Chess – click-to-move using chess.js

const boardEl = document.getElementById('board');
const turnTextEl = document.getElementById('turnText');
const gameStatusEl = document.getElementById('gameStatus');
const moveLogEl = document.getElementById('moveLog');
const capturedWhiteEl = document.getElementById('capturedWhite');
const capturedBlackEl = document.getElementById('capturedBlack');
const resetBtn = document.getElementById('resetBtn');

const promotionOverlay = document.getElementById('promotionOverlay');
const promotionChoicesEl = document.getElementById('promotionChoices');
const cancelPromotionBtn = document.getElementById('cancelPromotion');

// Global game object from chess.js
const game = new Chess();

// Square helpers
const files = ['a','b','c','d','e','f','g','h'];
const ranks = ['8','7','6','5','4','3','2','1'];

// LOTR character mapping per starting square and per promotion
const startCharactersBySquare = {
  // White (Fellowship)
  'a1': { name: 'Boromir', color: 'w', type: 'r' },
  'b1': { name: 'Éomer', color: 'w', type: 'n' },
  'c1': { name: 'Legolas', color: 'w', type: 'b' },
  'd1': { name: 'Gandalf', color: 'w', type: 'q' },
  'e1': { name: 'Aragorn', color: 'w', type: 'k' },
  'f1': { name: 'Gimli', color: 'w', type: 'b' },
  'g1': { name: 'Théoden', color: 'w', type: 'n' },
  'h1': { name: 'Faramir', color: 'w', type: 'r' },
  'a2': { name: 'Frodo', color: 'w', type: 'p' },
  'b2': { name: 'Samwise', color: 'w', type: 'p' },
  'c2': { name: 'Meriadoc', color: 'w', type: 'p' },
  'd2': { name: 'Peregrin', color: 'w', type: 'p' },
  'e2': { name: 'Bilbo', color: 'w', type: 'p' },
  'f2': { name: 'Éowyn', color: 'w', type: 'p' },
  'g2': { name: 'Arwen', color: 'w', type: 'p' },
  'h2': { name: 'Haldir', color: 'w', type: 'p' },
  // Black (Mordor)
  'a8': { name: 'Gothmog', color: 'b', type: 'r' },
  'b8': { name: 'Lurtz', color: 'b', type: 'n' },
  'c8': { name: 'Saruman', color: 'b', type: 'b' },
  'd8': { name: 'Witch-king', color: 'b', type: 'q' },
  'e8': { name: 'Sauron', color: 'b', type: 'k' },
  'f8': { name: 'Mouth of Sauron', color: 'b', type: 'b' },
  'g8': { name: 'Uglúk', color: 'b', type: 'n' },
  'h8': { name: 'Grishnákh', color: 'b', type: 'r' },
  'a7': { name: 'Azog', color: 'b', type: 'p' },
  'b7': { name: 'Bolg', color: 'b', type: 'p' },
  'c7': { name: 'Shagrat', color: 'b', type: 'p' },
  'd7': { name: 'Gorbag', color: 'b', type: 'p' },
  'e7': { name: 'Snaga', color: 'b', type: 'p' },
  'f7': { name: 'Mauhúr', color: 'b', type: 'p' },
  'g7': { name: 'Ufthak', color: 'b', type: 'p' },
  'h7': { name: 'Sharku', color: 'b', type: 'p' }
};

const promotionCharacters = {
  w: {
    q: { name: 'Galadriel', color: 'w', type: 'q' },
    r: { name: 'Elrond', color: 'w', type: 'r' },
    b: { name: 'Celeborn', color: 'w', type: 'b' },
    n: { name: 'Shadowfax', color: 'w', type: 'n' }
  },
  b: {
    q: { name: 'Shelob', color: 'b', type: 'q' },
    r: { name: 'Troll Chieftain', color: 'b', type: 'r' },
    b: { name: 'Nazgûl', color: 'b', type: 'b' },
    n: { name: 'Fellbeast', color: 'b', type: 'n' }
  }
};

// Runtime assignment of characters to current square
let charAtSquare = {};
let selectedSquare = null;
let legalTargets = [];
let pendingPromotion = null; // { from, to, color }

const abbrev = (name) => {
  // Two-letter abbreviation from capitalized words
  const parts = name.split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

function initializeBoardSquares() {
  boardEl.innerHTML = '';
  let isDark = true; // a8 dark per standard
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const square = `${files[f]}${ranks[r]}`;
      const div = document.createElement('div');
      div.className = `square ${isDark ? 'dark' : 'light'} coord`;
      div.dataset.square = square;
      div.dataset.coord = square;
      div.setAttribute('role', 'gridcell');
      div.addEventListener('click', onSquareClick);
      boardEl.appendChild(div);
      isDark = !isDark;
    }
    isDark = !isDark;
  }
}

function resetCharacters() {
  charAtSquare = { ...startCharactersBySquare };
}

function render() {
  // Clear any piece content
  const children = boardEl.children;
  for (let i = 0; i < children.length; i++) {
    const sqEl = children[i];
    sqEl.classList.remove('highlight', 'legal', 'capture');
    sqEl.innerHTML = '';
    const square = sqEl.dataset.square;
    const piece = game.get(square);
    if (piece) {
      const pieceEl = document.createElement('div');
      pieceEl.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
      const character = charAtSquare[square] || fallbackCharacterForPiece(square, piece);
      pieceEl.title = `${character.name} – ${describePiece(piece)}`;
      const ab = document.createElement('div');
      ab.className = 'abbr';
      ab.textContent = abbrev(character.name);
      pieceEl.appendChild(ab);
      sqEl.appendChild(pieceEl);
    }
  }
  updateStatus();
}

function describePiece(piece) {
  const map = { p: 'Pawn', r: 'Rook', n: 'Knight', b: 'Bishop', q: 'Queen', k: 'King' };
  const side = piece.color === 'w' ? 'Fellowship' : 'Mordor';
  return `${side} ${map[piece.type]}`;
}

function fallbackCharacterForPiece(square, piece) {
  // If an unexpected piece exists without mapped character (e.g., after load), fall back to generic
  return { name: `${piece.color === 'w' ? 'Ally' : 'Enemy'} ${piece.type.toUpperCase()}` };
}

function onSquareClick(e) {
  const square = e.currentTarget.dataset.square;
  const piece = game.get(square);

  if (selectedSquare) {
    // Try to move to this square if legal
    const move = legalTargets.find(m => m.to === square);
    if (move) {
      handleMoveAttempt(move);
      return;
    }
  }

  // Select if piece of current side
  if (piece && piece.color === game.turn()) {
    selectSquare(square);
  } else {
    clearSelection();
  }
}

function selectSquare(square) {
  clearSelection();
  selectedSquare = square;
  const sqEl = elForSquare(square);
  sqEl.classList.add('highlight');
  legalTargets = game.moves({ square, verbose: true });
  markLegalTargets(legalTargets);
}

function clearSelection() {
  selectedSquare = null;
  legalTargets = [];
  const squares = boardEl.querySelectorAll('.square');
  squares.forEach(el => el.classList.remove('highlight', 'legal', 'capture'));
}

function markLegalTargets(moves) {
  moves.forEach(m => {
    const target = elForSquare(m.to);
    if (!target) return;
    if (m.flags.includes('c') || m.flags.includes('e')) {
      target.classList.add('capture');
    } else {
      target.classList.add('legal');
    }
  });
}

function elForSquare(square) {
  return boardEl.querySelector(`[data-square="${square}"]`);
}

function handleMoveAttempt(move) {
  // Handle promotion if needed (pawn reaching back rank)
  const isPawn = move.piece === 'p';
  const targetRank = move.to[1];
  const needsPromotion = isPawn && (targetRank === '8' || targetRank === '1');

  if (needsPromotion) {
    pendingPromotion = { from: move.from, to: move.to, color: game.turn() };
    openPromotionChooser(game.turn());
    return;
  }

  applyMoveAndUpdate(move);
}

function applyMoveAndUpdate(move, promotionChoice) {
  const beforeToChar = charAtSquare[move.to];

  const moveObj = promotionChoice
    ? { from: move.from, to: move.to, promotion: promotionChoice }
    : { from: move.from, to: move.to };

  const result = game.move(moveObj);
  if (!result) {
    // Illegal (should not happen since we filter), just re-render
    clearSelection();
    render();
    return;
  }

  // Handle special capture squares (en passant)
  if (result.captured && result.flags.includes('e')) {
    const toFile = result.to[0];
    const toRank = parseInt(result.to[1], 10);
    const capturedSquare = `${toFile}${result.color === 'w' ? toRank - 1 : toRank + 1}`;
    const capturedChar = charAtSquare[capturedSquare];
    if (capturedChar) recordCapture(result.color, capturedChar);
    delete charAtSquare[capturedSquare];
  } else if (result.captured && beforeToChar) {
    // Normal capture
    recordCapture(result.color, beforeToChar);
  }

  // Move character assignment
  charAtSquare[result.to] = charAtSquare[result.from];
  delete charAtSquare[result.from];

  // Promotion assigns new character identity
  if (result.promotion) {
    charAtSquare[result.to] = { ...promotionCharacters[result.color][result.promotion] };
  }

  // Castling rook movement character transfer
  if (result.flags.includes('k') || result.flags.includes('q')) {
    const isWhite = result.color === 'w';
    if (result.flags.includes('k')) {
      // king side
      const rookFrom = isWhite ? 'h1' : 'h8';
      const rookTo   = isWhite ? 'f1' : 'f8';
      charAtSquare[rookTo] = charAtSquare[rookFrom];
      delete charAtSquare[rookFrom];
    } else if (result.flags.includes('q')) {
      // queen side
      const rookFrom = isWhite ? 'a1' : 'a8';
      const rookTo   = isWhite ? 'd1' : 'd8';
      charAtSquare[rookTo] = charAtSquare[rookFrom];
      delete charAtSquare[rookFrom];
    }
  }

  appendMoveToLog(result);
  clearSelection();
  render();
}

function appendMoveToLog(result) {
  const li = document.createElement('li');
  li.textContent = result.san;
  moveLogEl.appendChild(li);
  moveLogEl.scrollTop = moveLogEl.scrollHeight;
}

function recordCapture(byColor, capturedChar) {
  const list = byColor === 'w' ? capturedBlackEl : capturedWhiteEl;
  const li = document.createElement('li');
  li.textContent = capturedChar.name;
  list.appendChild(li);
}

function updateStatus() {
  const turnSide = game.turn() === 'w' ? 'White (Fellowship)' : 'Black (Mordor)';
  turnTextEl.textContent = turnSide;

  let status = '';
  if (game.in_checkmate()) {
    status = 'Checkmate.';
  } else if (game.in_stalemate()) {
    status = 'Stalemate.';
  } else if (game.in_threefold_repetition()) {
    status = 'Draw by threefold repetition.';
  } else if (game.insufficient_material()) {
    status = 'Draw by insufficient material.';
  } else if (game.in_check()) {
    status = 'Check!';
  }
  gameStatusEl.textContent = status;
}

function openPromotionChooser(color) {
  promotionChoicesEl.innerHTML = '';
  const choices = promotionCharacters[color];
  Object.entries(choices).forEach(([type, meta]) => {
    const btn = document.createElement('button');
    btn.textContent = `${meta.name} (${pieceTypeName(type)})`;
    btn.addEventListener('click', () => {
      if (!pendingPromotion) return;
      const { from, to } = pendingPromotion;
      const pseudoMove = { from, to, piece: 'p' };
      applyMoveAndUpdate(pseudoMove, type);
      pendingPromotion = null;
      closePromotionChooser();
    });
    promotionChoicesEl.appendChild(btn);
  });
  promotionOverlay.classList.remove('hidden');
  promotionOverlay.setAttribute('aria-hidden', 'false');
}

function closePromotionChooser() {
  promotionOverlay.classList.add('hidden');
  promotionOverlay.setAttribute('aria-hidden', 'true');
}

cancelPromotionBtn.addEventListener('click', () => {
  pendingPromotion = null;
  closePromotionChooser();
  clearSelection();
  render();
});

resetBtn.addEventListener('click', () => {
  game.reset();
  resetCharacters();
  clearCapturedAndLog();
  clearSelection();
  render();
});

function clearCapturedAndLog() {
  capturedWhiteEl.innerHTML = '';
  capturedBlackEl.innerHTML = '';
  moveLogEl.innerHTML = '';
}

function pieceTypeName(t) {
  return ({ p: 'Pawn', r: 'Rook', n: 'Knight', b: 'Bishop', q: 'Queen', k: 'King' })[t];
}

// Initialize
initializeBoardSquares();
resetCharacters();
render();