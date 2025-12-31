const { useState, useEffect } = React;

const BOARD_SIZE = 5;
const CENTER = { row: 2, col: 2 };

const SlideGame = () => {
  const [gameState, setGameState] = useState('rules');
  const [board, setBoard] = useState(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [winner, setWinner] = useState(null);
  const [playerCard, setPlayerCard] = useState(null);
  const [cpuCard, setCpuCard] = useState(null);
  const [selectedCardSide, setSelectedCardSide] = useState(null);
  const [revealedCard, setRevealedCard] = useState(null);
  const [movingPiece, setMovingPiece] = useState(null);
  const [showWinnerText, setShowWinnerText] = useState(false);

  function initializeBoard() {
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    // プレイヤーの駒（下端、中央列を除く4個）
    const playerCols = [0, 1, 3, 4];
    for (const col of playerCols) {
      newBoard[BOARD_SIZE - 1][col] = 'player';
    }
    // CPUの駒（上端、中央列を除く4個）
    for (const col of playerCols) {
      newBoard[0][col] = 'cpu';
    }
    return newBoard;
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || currentPlayer !== 'player' || !selectedPiece || winner) return;

      let direction = null;
      if (e.key === 'ArrowUp') {
        direction = 'up';
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        direction = 'down';
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        direction = 'left';
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        direction = 'right';
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setSelectedPiece(null);
        e.preventDefault();
        return;
      }

      if (direction) {
        const destination = getSlideEnd(selectedPiece, direction, board);
        if (destination.row !== selectedPiece.row || destination.col !== selectedPiece.col) {
          movePiece(selectedPiece, destination);
          setSelectedPiece(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentPlayer, selectedPiece, board, winner]);

  const handleCardSelect = (side) => {
    if (revealedCard) return;
    
    const suits = ['♠', '♥', '♦', '♣'];
    const playerValue = Math.floor(Math.random() * 13) + 1;
    const cpuValue = Math.floor(Math.random() * 13) + 1;
    const playerSuit = suits[Math.floor(Math.random() * 4)];
    const cpuSuit = suits[Math.floor(Math.random() * 4)];

    setPlayerCard({ value: playerValue, suit: playerSuit });
    setCpuCard({ value: cpuValue, suit: cpuSuit });
    setSelectedCardSide(side);

    setTimeout(() => {
      setRevealedCard(side);
      setTimeout(() => {
        setRevealedCard('both');
        
        setTimeout(() => {
          if (playerValue === cpuValue) {
            setRevealedCard(null);
            setSelectedCardSide(null);
            setPlayerCard(null);
            setCpuCard(null);
            return;
          }
          
          if (playerValue > cpuValue) {
            setCurrentPlayer('player');
            setTimeout(() => {
              setGameState('playing');
            }, 2000);
          } else {
            setCurrentPlayer('cpu');
            setTimeout(() => {
              setGameState('playing');
              setTimeout(() => cpuTurn(board), 500);
            }, 2000);
          }
        }, 1000);
      }, 500);
    }, 300);
  };

  const handleCellClick = (row, col) => {
    if (gameState !== 'playing' || currentPlayer !== 'player' || movingPiece || winner) return;

    if (selectedPiece) {
      if (selectedPiece.row === row && selectedPiece.col === col) {
        setSelectedPiece(null);
        return;
      }
      
      if (board[row][col] === 'player') {
        setSelectedPiece({ row, col });
        return;
      }
      
      if (canMove(selectedPiece, { row, col })) {
        movePiece(selectedPiece, { row, col });
        setSelectedPiece(null);
      }
    } else {
      if (board[row][col] === 'player') {
        setSelectedPiece({ row, col });
      }
    }
  };

  const canMove = (from, to) => {
    if (from.row === to.row && from.col === to.col) return false;
    if (board[to.row][to.col]) return false;
    if (from.row !== to.row && from.col !== to.col) return false;

    const path = getPath(from, to);
    const slideEnd = getSlideEnd(from, path.direction, board);
    
    return slideEnd.row === to.row && slideEnd.col === to.col;
  };

  const getPath = (from, to) => {
    if (from.row < to.row) return { direction: 'down' };
    if (from.row > to.row) return { direction: 'up' };
    if (from.col < to.col) return { direction: 'right' };
    if (from.col > to.col) return { direction: 'left' };
  };

  const getSlideEnd = (from, direction, currentBoard) => {
    let row = from.row;
    let col = from.col;

    const moves = {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1]
    };

    const [dRow, dCol] = moves[direction];

    while (true) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
        break;
      }

      if (currentBoard[newRow][newCol] && !(newRow === from.row && newCol === from.col)) {
        break;
      }

      row = newRow;
      col = newCol;
    }

    return { row, col };
  };

  const movePiece = (from, to) => {
    setMovingPiece({ from, to, player: board[from.row][from.col] });
    
    const newBoard = board.map(row => [...row]);
    newBoard[to.row][to.col] = newBoard[from.row][from.col];
    newBoard[from.row][from.col] = null;
    
    setTimeout(() => {
      setBoard(newBoard);
      setMovingPiece(null);

      if (to.row === CENTER.row && to.col === CENTER.col) {
        setWinner(currentPlayer);
        setTimeout(() => {
          setShowWinnerText(true);
        }, 800);
        return;
      }

      const nextPlayer = currentPlayer === 'player' ? 'cpu' : 'player';
      setCurrentPlayer(nextPlayer);

      if (nextPlayer === 'cpu') {
        setTimeout(() => cpuTurn(newBoard), 2000);
      }
    }, 150);
  };

  const cpuTurn = (currentBoard) => {
    const cpuPieces = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (currentBoard[row][col] === 'cpu') {
          cpuPieces.push({ row, col });
        }
      }
    }

    const possibleMoves = [];
    for (const piece of cpuPieces) {
      for (const direction of ['up', 'down', 'left', 'right']) {
        const end = getSlideEnd(piece, direction, currentBoard);
        if (end.row !== piece.row || end.col !== piece.col) {
          possibleMoves.push({ from: piece, to: end });
        }
      }
    }

    if (possibleMoves.length === 0) return;

    possibleMoves.sort((a, b) => {
      const distA = Math.abs(a.to.row - CENTER.row) + Math.abs(a.to.col - CENTER.col);
      const distB = Math.abs(b.to.row - CENTER.row) + Math.abs(b.to.col - CENTER.col);
      return distA - distB;
    });

    const move = possibleMoves[0];
    
    setMovingPiece({ from: move.from, to: move.to, player: 'cpu' });
    
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
    newBoard[move.from.row][move.from.col] = null;
    
    setTimeout(() => {
      setBoard(newBoard);
      setMovingPiece(null);

      if (move.to.row === CENTER.row && move.to.col === CENTER.col) {
        setWinner('cpu');
        setTimeout(() => {
          setShowWinnerText(true);
        }, 800);
        return;
      }

      setCurrentPlayer('player');
    }, 150);
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setGameState('rules');
    setCurrentPlayer(null);
    setSelectedPiece(null);
    setWinner(null);
    setPlayerCard(null);
    setCpuCard(null);
    setSelectedCardSide(null);
    setRevealedCard(null);
    setMovingPiece(null);
    setShowWinnerText(false);
  };

  const getCardDisplay = (value) => {
    if (value === 1) return 'A';
    if (value === 11) return 'J';
    if (value === 12) return 'Q';
    if (value === 13) return 'K';
    return value.toString();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.85)), url("data:image/svg+xml,%3Csvg width=\\"200\\" height=\\"200\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cfilter id=\\"noise\\"%3E%3CfeTurbulence type=\\"fractalNoise\\" baseFrequency=\\"0.65\\" numOctaves=\\"3\\" /%3E%3CfeComponentTransfer%3E%3CfeFuncR type=\\"discrete\\" tableValues=\\"0.2 0.3 0.25\\"/%3E%3CfeFuncG type=\\"discrete\\" tableValues=\\"0.2 0.3 0.25\\"/%3E%3CfeFuncB type=\\"discrete\\" tableValues=\\"0.2 0.3 0.25\\"/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width=\\"200\\" height=\\"200\\" filter=\\"url(%23noise)\\"/%3E%3C/svg%3E")',
        backgroundColor: '#0a0a0a'
      }}
    >
      <div className="bg-gradient-to-b from-stone-900 via-neutral-950 to-black rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-4xl backdrop-blur-sm"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), inset 0 2px 4px rgba(120, 113, 108, 0.1)'
        }}
      >
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-center mb-6 sm:mb-10 text-transparent bg-clip-text bg-gradient-to-r from-stone-300 via-stone-100 to-stone-300 tracking-wider drop-shadow-lg">
          グリッドスライド
        </h1>

        {gameState === 'rules' && (
          <div className="text-center max-w-2xl mx-auto">
            {/* ゲームイメージ */}
            <div className="mb-6 sm:mb-8 inline-block bg-gradient-to-br from-amber-950 via-yellow-950 to-amber-950 p-3 sm:p-4 rounded-3xl shadow-2xl"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.9), inset 0 1px 2px rgba(120, 113, 108, 0.3)'
              }}
            >
              <div className="grid grid-cols-5 gap-0">
                {[...Array(25)].map((_, i) => {
                  const row = Math.floor(i / 5);
                  const col = i % 5;
                  const isCenter = row === 2 && col === 2;
                  const isTopRow = row === 0 && col !== 2; // 中央列を除く
                  const isBottomRow = row === 4 && col !== 2; // 中央列を除く
                  
                  return (
                    <div
                      key={i}
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${
                        isCenter ? 'bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-600' : 'bg-gradient-to-br from-amber-900 via-yellow-900 to-amber-950'
                      }`}
                      style={{
                        boxShadow: isCenter 
                          ? 'inset 0 0 20px rgba(252, 211, 77, 0.8)' 
                          : 'inset 0 2px 6px rgba(0,0,0,0.5)',
                        borderTop: '1px solid rgba(120, 113, 108, 0.1)',
                        borderLeft: '1px solid rgba(120, 113, 108, 0.1)'
                      }}
                    >
                      {isCenter && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 shadow-lg"
                          style={{
                            boxShadow: '0 0 15px rgba(252, 211, 77, 0.6), inset 0 1px 2px rgba(255,255,255,0.5)'
                          }}
                        ></div>
                      )}
                      {isTopRow && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-xl relative"
                          style={{
                            boxShadow: '0 4px 8px rgba(0,0,0,0.9), inset 0 2px 4px rgba(0,0,0,0.8), inset 0 -1px 2px rgba(255,255,255,0.1)'
                          }}
                        >
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tl from-gray-600 via-transparent to-transparent opacity-20"></div>
                        </div>
                      )}
                      {isBottomRow && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-100 via-white to-gray-200 shadow-xl relative"
                          style={{
                            boxShadow: '0 4px 8px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.9)'
                          }}
                        >
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-gray-300 opacity-40"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-black bg-opacity-40 backdrop-blur-md px-6 sm:px-10 py-6 sm:py-8 rounded-2xl shadow-xl mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 mb-4 sm:mb-6 drop-shadow-lg">ルール</h2>
              <div className="text-left text-stone-200 font-serif space-y-3 sm:space-y-4 text-sm sm:text-base">
                <p>• 5×5の盤面で白黒の駒を動かします</p>
                <p>• 駒は前後左右に滑り、端か他の駒に当たるまで止まれません</p>
                <p>• 中央の金色のマスに駒を止めた方が勝ちです</p>
                <p>• 自分の駒を選択し、移動先をクリックまたは矢印キーで操作</p>
              </div>
            </div>
            <button
              onClick={() => setGameState('card-draw')}
              className="px-10 sm:px-12 py-4 sm:py-5 bg-gradient-to-b from-stone-700 via-stone-800 to-stone-950 text-white text-lg sm:text-xl font-bold font-serif rounded-2xl hover:from-stone-600 hover:via-stone-700 hover:to-stone-900 transition-all duration-300 shadow-2xl transform hover:scale-105"
              style={{
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255,255,255,0.1)'
              }}
            >
              まずは先攻後攻を決める
            </button>
          </div>
        )}

        {gameState === 'card-draw' && (
          <div className="text-center">
            <h2 className="text-lg sm:text-2xl mb-6 sm:mb-8 font-serif text-stone-200 tracking-wide drop-shadow-lg">
              {!revealedCard ? '数字の大きい方が先攻です。1枚選んでください。' : ''}
            </h2>
            <div className="flex justify-center gap-6 sm:gap-8 items-start">
              <div className="flex flex-col items-center">
                <p className="font-serif text-base sm:text-lg mb-3 sm:mb-4 text-stone-200 drop-shadow h-6 sm:h-7">
                  {revealedCard ? 'あなた' : ''}
                </p>
                <button
                  onClick={() => !revealedCard && handleCardSelect('left')}
                  disabled={revealedCard !== null}
                  className={`w-28 h-40 sm:w-36 sm:h-52 rounded-2xl shadow-2xl flex flex-col items-center justify-center transition-all duration-500 ${
                    revealedCard === 'left' || revealedCard === 'both' ? 'bg-white' : 'bg-gradient-to-br from-red-700 via-red-800 to-red-900'
                  } ${!revealedCard ? 'hover:scale-105 cursor-pointer' : ''}`}
                  style={{
                    border: (revealedCard === 'left' || revealedCard === 'both') ? '3px solid #78716c' : '3px solid #7f1d1d',
                    transform: revealedCard === 'left' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {revealedCard === 'left' || revealedCard === 'both' ? (
                    <div style={{ transform: 'rotateY(180deg)' }}>
                      <div className={`text-5xl sm:text-7xl font-bold ${playerCard.suit === '♥' || playerCard.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                        {getCardDisplay(playerCard.value)}
                      </div>
                      <div className={`text-3xl sm:text-5xl mt-2 ${playerCard.suit === '♥' || playerCard.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                        {playerCard.suit}
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-200 text-4xl sm:text-6xl opacity-40 font-serif">?</div>
                  )}
                </button>
              </div>

              <div className="flex flex-col items-center">
                <p className="font-serif text-base sm:text-lg mb-3 sm:mb-4 text-stone-200 drop-shadow h-6 sm:h-7">
                  {revealedCard ? 'CPU' : ''}
                </p>
                <button
                  onClick={() => !revealedCard && handleCardSelect('right')}
                  disabled={revealedCard !== null}
                  className={`w-28 h-40 sm:w-36 sm:h-52 rounded-2xl shadow-2xl flex flex-col items-center justify-center transition-all duration-500 ${
                    revealedCard === 'both' ? 'bg-white' : 'bg-gradient-to-br from-red-700 via-red-800 to-red-900'
                  } ${!revealedCard ? 'hover:scale-105 cursor-pointer' : ''}`}
                  style={{
                    border: revealedCard === 'both' ? '3px solid #78716c' : '3px solid #7f1d1d',
                    transform: revealedCard === 'both' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {revealedCard === 'both' ? (
                    <div style={{ transform: 'rotateY(180deg)' }}>
                      <div className={`text-5xl sm:text-7xl font-bold ${cpuCard.suit === '♥' || cpuCard.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                        {getCardDisplay(cpuCard.value)}
                      </div>
                      <div className={`text-3xl sm:text-5xl mt-2 ${cpuCard.suit === '♥' || cpuCard.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                        {cpuCard.suit}
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-200 text-4xl sm:text-6xl opacity-40 font-serif">?</div>
                  )}
                </button>
              </div>
            </div>

            {revealedCard === 'both' && playerCard && cpuCard && (
              <div className="mt-6 sm:mt-8 bg-black bg-opacity-40 backdrop-blur-sm px-6 sm:px-8 py-4 sm:py-5 rounded-2xl shadow-xl max-w-md mx-auto">
                <p className="text-xl sm:text-3xl font-serif font-bold text-stone-100 drop-shadow-lg">
                  {playerCard.value > cpuCard.value && 'あなたの先攻です'}
                  {cpuCard.value > playerCard.value && 'CPUの先攻です'}
                  {playerCard.value === cpuCard.value && '引き分け　もう一度'}
                </p>
              </div>
            )}
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex flex-col items-center">
            <div className="mb-6 sm:mb-8 text-center bg-black bg-opacity-40 backdrop-blur-md px-6 sm:px-8 py-4 sm:py-5 rounded-2xl shadow-xl max-w-md">
              <p className="text-xl sm:text-2xl font-serif font-bold text-stone-100 drop-shadow-lg">
                {currentPlayer === 'player' ? 'あなたの番' : 'CPUの番'}
              </p>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 font-serif drop-shadow">
                中央のマスに止まったら勝利
              </p>
            </div>

            <div className="relative">
              <div className="relative inline-block bg-gradient-to-br from-amber-950 via-yellow-950 to-amber-950 p-3 sm:p-6 rounded-3xl shadow-2xl"
                style={{
                  boxShadow: '0 20px 60px rgba(0,0,0,0.9), inset 0 1px 2px rgba(120, 113, 108, 0.3)'
                }}
              >
                {board.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((cell, colIndex) => {
                      const isCenter = rowIndex === CENTER.row && colIndex === CENTER.col;
                      const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                      const isMoving = movingPiece?.to.row === rowIndex && movingPiece?.to.col === colIndex;
                      
                      return (
                        <div
                          key={colIndex}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          className={`
                            w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center relative
                            ${isCenter ? 'bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-600' : 'bg-gradient-to-br from-amber-900 via-yellow-900 to-amber-950'}
                            ${cell === 'player' && currentPlayer === 'player' && !winner ? 'cursor-pointer' : ''}
                            ${selectedPiece && !cell && !winner ? 'cursor-pointer' : ''}
                            transition-all duration-200
                          `}
                          style={{
                            boxShadow: isCenter 
                              ? 'inset 0 0 30px rgba(252, 211, 77, 0.8), 0 0 20px rgba(252, 211, 77, 0.3)' 
                              : 'inset 0 2px 8px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(120, 113, 108, 0.1)',
                            borderTop: '1px solid rgba(120, 113, 108, 0.1)',
                            borderLeft: '1px solid rgba(120, 113, 108, 0.1)'
                          }}
                        >
                          {isCenter && !cell && (
                            <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 shadow-2xl animate-pulse"
                              style={{
                                boxShadow: '0 0 20px rgba(252, 211, 77, 0.8), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)'
                              }}
                            ></div>
                          )}
                          {cell === 'player' && (
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-100 via-white to-gray-200 shadow-2xl relative ${isSelected ? 'ring-4 ring-yellow-300 ring-offset-2 ring-offset-transparent' : ''} ${isMoving ? 'animate-pulse' : ''}`}
                              style={{
                                boxShadow: isSelected 
                                  ? '0 0 30px rgba(253, 224, 71, 0.9), 0 8px 16px rgba(0,0,0,0.6), inset 0 -4px 8px rgba(0,0,0,0.15), inset 0 4px 8px rgba(255,255,255,0.9)' 
                                  : '0 8px 16px rgba(0,0,0,0.6), inset 0 -4px 8px rgba(0,0,0,0.15), inset 0 4px 8px rgba(255,255,255,0.9), inset 0 0 20px rgba(255,255,255,0.5)'
                              }}
                            >
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-gray-300 opacity-40"></div>
                            </div>
                          )}
                          {cell === 'cpu' && (
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl relative ${isMoving ? 'animate-pulse' : ''}`}
                              style={{
                                boxShadow: '0 8px 16px rgba(0,0,0,0.9), inset 0 4px 8px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(255,255,255,0.1), inset 0 0 20px rgba(0,0,0,0.5)'
                              }}
                            >
                              <div className="absolute inset-0 rounded-full bg-gradient-to-tl from-gray-600 via-transparent to-transparent opacity-20"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {winner && showWinnerText && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm rounded-3xl">
                  <div className="text-center p-6 sm:p-8">
                    <h2 className="text-3xl sm:text-5xl font-serif font-bold mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 drop-shadow-2xl">
                      {winner === 'player' ? 'あなたの勝利' : 'CPUの勝利'}
                    </h2>
                    <button
                      onClick={resetGame}
                      className="px-8 sm:px-12 py-3 sm:py-5 bg-gradient-to-b from-stone-700 via-stone-800 to-stone-950 text-white text-base sm:text-xl font-bold font-serif rounded-2xl hover:from-stone-600 hover:via-stone-700 hover:to-stone-900 transition-all duration-300 shadow-2xl transform hover:scale-105"
                      style={{
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255,255,255,0.1)'
                      }}
                    >
                      もう一度プレイ
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-8 text-center bg-black bg-opacity-40 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-xl max-w-sm sm:max-w-lg">
              <p className="text-xs sm:text-sm text-stone-300 font-serif drop-shadow">駒は滑って端か他の駒に当たるまで止まれません</p>
              {selectedPiece && !winner && (
                <div className="text-yellow-300 font-bold mt-2 sm:mt-3 font-serif drop-shadow-lg text-xs sm:text-sm">
                  <p>移動先をクリック または 矢印キーで方向指定</p>
                  <p className="text-xs mt-1 text-stone-400">ESCキーまたは駒を再クリックで選択解除</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.render(<SlideGame />, document.getElementById("root"));
