let game = null;
// let bestScore = 0;
// let score = 0;
let nextId = 1;
size = getComputedStyle(document.querySelector(":root")).getPropertyValue(
  "--size"
);
let gameBoard;

function createGameBoard() {
  gameBoard = document.createElement("div");
  gameBoard.id = "game-board";
  for (let i = 0; i < size * size; i++) {
    let cell = document.createElement("div");
    cell.className = "cell";
    gameBoard.appendChild(cell);
  }
  document.querySelector("body").appendChild(gameBoard);
}

function addRandomNumber() {
  let emptyCells = game
    .map((arrEle, index) => index)
    .filter((index) => game[index] === null); //Array of indexes of empty cells
  let randCellPos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  let newObj = {
    id: nextId++,
    index: randCellPos,
    value: generateRandomNumber(),
  };
  game[randCellPos] = newObj;
}

function generateRandomNumber() {
  return Math.random() <= 0.8 ? 2 : 4;
}

function updateDOM(before, after) {
  let newTiles = getNewTiles(before, after);
  let existingTiles = getExistingTiles(before, after);
  let mergedTiles = getMergedTiles(after);
  removeMergedTiles(mergedTiles);
  insertIntoDOM(newTiles, true);
  insertIntoDOM(existingTiles);
}

function getMergedTiles(after) {
  return after.filter((tile) => tile && tile.mergedIds);
}

function removeMergedTiles(mergedTiles) {
  for (let tile of mergedTiles) {
    for (let id of tile.mergedIds) {
      let divTile = document.getElementById(id);
      positionTile(tile, divTile);
      setTimeout(() => {
        divTile.remove();
      }, 150);
    }
  }
}

function insertIntoDOM(tiles, isNew) {
  for (let i = 0; i < tiles.length; i++) {
    let tile = tiles[i];
    if (tile) {
      if (isNew) {
        let tileDiv = document.createElement("div");
        positionTile(tile, tileDiv);
        tileDiv.classList.add("tile");
        tileDiv.id = tile.id;
        backgroundLightness = 100 - Math.log2(tile.value) * 9;
        tileDiv.style.setProperty(
          "--background-lightness",
          `${backgroundLightness}%`
        );
        tileDiv.style.setProperty(
          "--text-lightness",
          `${backgroundLightness <= 50 ? 90 : 10}%`
        );
        tileDiv.innerText = tile.value;
        gameBoard.appendChild(tileDiv);
      } else {
        let existingTile = document.getElementById(tile.id);
        positionTile(tile, existingTile);
      }
    }
  }
}

function positionTile(tile, elm) {
  let x = Math.floor(tile.index % size);
  let y = Math.floor(tile.index / size);
  elm.style.setProperty("--x", x);
  elm.style.setProperty("--y", y);
}

function getNewTiles(before, after) {
  let beforeIds = before.filter((tile) => tile).map((tile) => tile.id);
  let newTiles = after.filter((tile) => {
    return tile && beforeIds.indexOf(tile.id) === -1;
  });

  return newTiles;
}

function getExistingTiles(before, after) {
  let beforeIds = before.filter((tile) => tile).map((tile) => tile.id);
  let existingTiles = after.filter((tile) => {
    return tile && beforeIds.indexOf(tile.id) !== -1;
  });

  return existingTiles;
}

function startGame() {
  game = Array(size * size).fill(null);
  let previousGame = [...game];
  addRandomNumber();
  addRandomNumber();
  updateDOM(previousGame, game);
}

// startGame();

function getIndexForPoint(x, y) {
  return y * size + x;
}

function reflectGrid(grid) {
  let tempGrid = Array(size * size).fill(0);
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let index1 = getIndexForPoint(col, row);
      let index2 = getIndexForPoint(size - 1 - col, row);
      tempGrid[index2] = grid[index1];
    }
  }
  return tempGrid;
}

function rotateLeft90Deg(grid) {
  let tempGrid = Array(size * size).fill(0);
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let index1 = getIndexForPoint(col, row);
      let index2 = getIndexForPoint(row, size - 1 - col);
      tempGrid[index2] = grid[index1];
    }
  }
  return tempGrid;
}

function rotateRight90Deg(grid) {
  let tempGrid = Array(size * size).fill(0);
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let index1 = getIndexForPoint(col, row);
      let index2 = getIndexForPoint(size - 1 - row, col);
      tempGrid[index2] = grid[index1];
    }
  }
  return tempGrid;
}

function shiftGameUp(gameGrid) {
  let rotatedGame = rotateLeft90Deg(gameGrid);
  rotatedGame = shiftGameLeft(rotatedGame);
  return rotateRight90Deg(rotatedGame);
}

function shiftGameDown(gameGrid) {
  let rotatedGame = rotateRight90Deg(gameGrid);
  rotatedGame = shiftGameLeft(rotatedGame);
  return rotateLeft90Deg(rotatedGame);
}

function shiftGameRight(gameGrid) {
  let reflectedGame = reflectGrid(gameGrid);
  reflectedGame = shiftGameLeft(reflectedGame);
  return reflectGrid(reflectedGame);
}

function shiftGameLeft(gameGrid) {
  let newGameState = [];
  for (let i = 0; i < size; i++) {
    let startPos = size * i;
    let endPos = size * (i + 1);
    let row = gameGrid.slice(startPos, endPos);
    let filteredRow = row.filter((tile) => tile);
    for (let tile of filteredRow) {
      delete tile.mergedIds;
    }

    for (let j = 0; j < filteredRow.length - 1; j++) {
      if (filteredRow[j].value == filteredRow[j + 1].value) {
        let sum = filteredRow[j].value * 2;
        filteredRow[j] = {
          id: nextId++,
          mergedIds: [filteredRow[j].id, filteredRow[j + 1].id],
          value: sum,
        };
        filteredRow.splice(j + 1, 1);
      }
    }
    while (filteredRow.length < size) {
      filteredRow.push(null);
    }
    newGameState.push(...filteredRow);
  }
  return newGameState;
}

function handleKeypress(e) {
  let modifiers = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
  let whichKey = e.which;

  let prevGame = [...game];
  if (!modifiers) {
    // e.preventDefault();
    switch (whichKey) {
      case 37:
      case 65:
        game = shiftGameLeft(game);
        break;
      case 38:
      case 87:
        game = shiftGameUp(game);
        break;
      case 39:
      case 68:
        game = shiftGameRight(game);
        break;
      case 40:
      case 83:
        game = shiftGameDown(game);
        break;
    }
    game = game.map((tile, index) => {
      return tile ? { ...tile, index: index } : null;
    });
    if (compareGameStates(prevGame, game)) return;
    addRandomNumber();
    updateDOM(prevGame, game);
  }
}

document.addEventListener("touchstart", handleTouchStart, false);
document.addEventListener("touchmove", handleTouchMove, false);

let xDown = null;
let yDown = null;

function handleTouchStart(evt) {
  xDown = evt.touches[0].clientX;
  yDown = evt.touches[0].clientY;
}

function handleTouchMove(evt) {
  const prevGame = [...game];
  if (!xDown || !yDown) {
    return;
  }
  const xUp = evt.touches[0].clientX;
  const yUp = evt.touches[0].clientY;

  const xDiff = xDown - xUp;
  const yDiff = yDown - yUp;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) {
      game = shiftGameLeft(game);
    } else {
      game = shiftGameRight(game);
    }
  } else {
    if (yDiff > 0) {
      game = shiftGameUp(game);
    } else {
      game = shiftGameDown(game);
    }
  }
  game = game.map((tile, index) => {
    if (tile) {
      return {
        ...tile,
        index,
      };
    } else {
      return null;
    }
  });
  if (compareGameStates(prevGame, game)) return;
  addRandomNumber();
  updateDOM(prevGame, game);
  if (gameOver()) {
    setTimeout(() => {
      endDiv.classList.add("active");
    }, 800);
    return;
  }
  xDown = null;
  yDown = null;
}

function compareGameStates(before, after) {
  for (let i = 0; i < size * size; i++) {
    if (before[i] == null && after[i] == null) continue;
    if (before[i] && after[i]) {
      if (
        before[i].id == after[i].id &&
        before[i].index == after[i].index &&
        before[i].value == after[i].value
      ) {
        continue;
      }
    }
    return false;
  }
  return true;
}

//Event Listening Code

document.addEventListener("keydown", handleKeypress);

window.onload = function () {
  createGameBoard();
  startGame();
};
