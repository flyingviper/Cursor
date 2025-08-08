# Lord of the Rings Chess

A lightweight, browser-based chess game where every piece is mapped to a Lord of the Rings character. Click a piece to see legal moves, then click a highlighted square to move. Captures, check, checkmate, stalemate, and pawn promotion are supported.

## Run

Open `index.html` in a browser, or serve the folder:

```bash
cd /workspace/lotr-chess
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes
- Uses `chess.js` for move validation.
- Characters persist with their piece as it moves. Captured pieces are listed in the sidebar.
- Promotion lets you choose LOTR-themed characters per side.