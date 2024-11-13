let rows = 20;
let cols = 20;

const grids = {
  dijkstra: document.getElementById("grid-dijkstra"),
  astar: document.getElementById("grid-astar"),
  bfs: document.getElementById("grid-bfs"),
  dfs: document.getElementById("grid-dfs"),
};

const algorithms = ["dijkstra", "astar", "bfs", "dfs"];
const isStartSelected = {};
const isEndSelected = {};
let startCells = {};
let endCells = {};
let isMouseDown = false;
let isClearMode = false;

// Initialize flags and setup for each grid
algorithms.forEach((alg) => {
  isStartSelected[alg] = false;
  isEndSelected[alg] = false;
  startCells[alg] = null;
  endCells[alg] = null;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") isClearMode = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") isClearMode = false;
});

document.getElementById("apply-grid-size-btn").addEventListener("click", () => {
  rows = parseInt(document.getElementById("rows-input").value, 10);
  cols = parseInt(document.getElementById("columns-input").value, 10);
  createGrids();
});

document.getElementById("reset-btn").addEventListener("click", resetAllGrids);
document
  .getElementById("reset-path-btn")
  .addEventListener("click", resetAllPaths);

function createGrid(gridElement, algorithm) {
  console.log(gridElement);
  gridElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  gridElement.innerHTML = "";

  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    cell.addEventListener("mousedown", () => {
      isMouseDown = true;
      handleCellInteraction(cell, algorithm);
    });

    cell.addEventListener("mousemove", () => {
      if (isMouseDown) handleCellInteraction(cell, algorithm);
    });

    cell.addEventListener("mouseup", () => (isMouseDown = false));

    gridElement.appendChild(cell);
  }
}

function createGrids() {
  algorithms.forEach((alg) => {
    createGrid(grids[alg], alg);
  });
}

createGrids();

// Handle user interactions on any grid and reflect it across all grids
function handleCellInteraction(cell) {
  const cellIndex = Array.from(grids.dijkstra.children).indexOf(cell);

  // If the cell is not found in the grid, return early
  if (cellIndex === -1) return;

  // If no start node is selected across all grids
  if (!Object.values(isStartSelected).every(Boolean)) {
    Object.keys(grids).forEach((alg) => {
      const targetCell = grids[alg]?.children[cellIndex];
      if (targetCell) {
        targetCell.classList.add("start");
        isStartSelected[alg] = true;
        startCells[alg] = targetCell;
      }
    });
  }
  // If no end node is selected across all grids and the clicked cell is not a start cell
  else if (
    !Object.values(isEndSelected).every(Boolean) &&
    !cell.classList.contains("start")
  ) {
    Object.keys(grids).forEach((alg) => {
      const targetCell = grids[alg]?.children[cellIndex];
      if (targetCell) {
        targetCell.classList.add("end");
        isEndSelected[alg] = true;
        endCells[alg] = targetCell;
      }
    });
  }
  // Otherwise, toggle obstacle state
  else {
    const shouldRemoveObstacle = isClearMode;

    Object.keys(grids).forEach((alg) => {
      const targetCell = grids[alg]?.children[cellIndex];
      if (
        targetCell &&
        !targetCell.classList.contains("start") &&
        !targetCell.classList.contains("end")
      ) {
        if (shouldRemoveObstacle) {
          targetCell.classList.remove("obstacle");
        } else {
          targetCell.classList.add("obstacle");
        }
      }
    });
  }
}

// Reset all grids
function resetAllGrids() {
  algorithms.forEach((alg) => {
    Array.from(grids[alg].children).forEach((cell) => {
      cell.classList.remove("start", "end", "obstacle", "visited", "path");
    });
    isStartSelected[alg] = false;
    isEndSelected[alg] = false;
  });
}

// Reset paths only
function resetAllPaths() {
  algorithms.forEach((alg) => {
    Array.from(grids[alg].children).forEach((cell) => {
      cell.classList.remove("visited", "path");
    });
  });
}

// Start the visualization
algorithms.forEach((alg) => {
  document.getElementById("start-btn").addEventListener("click", () => {
    if (startCells[alg] && endCells[alg]) {
      const startIdx = Array.from(grids[alg].children).indexOf(startCells[alg]);
      const endIdx = Array.from(grids[alg].children).indexOf(endCells[alg]);

      let result;
      switch (alg) {
        case "dijkstra":
          startTimer();
          result = dijkstra(grids[alg].children, startIdx, endIdx, rows, cols);
          stopTimer(alg);
          break;
        case "astar":
          startTimer();
          result = aStar(grids[alg].children, startIdx, endIdx, rows, cols);
          stopTimer(alg);
          break;
        case "bfs":
          startTimer();
          result = bfs(grids[alg].children, startIdx, endIdx, rows, cols);
          stopTimer(alg);
          break;
        case "dfs":
          startTimer();
          result = dfs(grids[alg].children, startIdx, endIdx, rows, cols);
          stopTimer(alg);
          break;
      }

      const { visitedOrder, path } = result;
      visualizeVisitedNodes(grids[alg].children, visitedOrder, () => {
        visualizePath(grids[alg].children, path);
      });
    }
  });
});

// Dijkstra's Algorithm
function dijkstra(cells, startIdx, endIdx, rows, cols) {
  const distances = Array(cells.length).fill(Infinity);
  const prev = Array(cells.length).fill(null);
  distances[startIdx] = 0;

  const pq = [[startIdx, 0]];
  const visitedOrder = [];
  const visited = new Set();

  while (pq.length > 0) {
    pq.sort((a, b) => a[1] - b[1]);
    const [currentIdx, currentDist] = pq.shift();

    if (visited.has(currentIdx)) continue;
    visited.add(currentIdx);
    visitedOrder.push(currentIdx);

    if (currentIdx === endIdx) break;

    const neighbors = getNeighbors(currentIdx, rows, cols);
    for (const neighbor of neighbors) {
      if (
        !visited.has(neighbor) &&
        !cells[neighbor].classList.contains("obstacle")
      ) {
        const newDist = currentDist + 1;
        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          prev[neighbor] = currentIdx;
          pq.push([neighbor, newDist]);
        }
      }
    }
  }

  const path = [];
  let curr = endIdx;
  while (prev[curr] !== null) {
    path.push(curr);
    curr = prev[curr];
  }
  if (curr === startIdx) path.push(startIdx);
  return { visitedOrder, path: path.reverse() };
}

// Function to start the timer
function startTimer() {
  startTime = performance.now(); // Capture the start time
}

// Function to stop the timer and show the elapsed time
function stopTimer(currGridKey) {
  const endTime = performance.now(); // Capture the end time
  const elapsedTime = (endTime - startTime).toFixed(2); // Calculate time in milliseconds

  // Get the grid wrapper for the current grid using the key
  const currGridWrapper = grids[currGridKey].closest('.grid-wrapper');
  console.log(currGridWrapper);
  if (currGridWrapper) {
    // Find the timer div inside the grid-info-wrapper within the grid wrapper
    const timerDiv = currGridWrapper.querySelector(".grid-info-wrapper .timer");
    if (timerDiv) {
      timerDiv.innerText = `Time Taken: ${elapsedTime} ms`; // Display time
    }
  }
}

// A Star
function aStar(cells, startIdx, endIdx, rows, cols) {
  function heuristic(a, b) {
    const [x1, y1] = [Math.floor(a / cols), a % cols];
    const [x2, y2] = [Math.floor(b / cols), b % cols];
    //   return Math.abs(x1 - x2) + Math.abs(y1 - y2); // Manhattan distance for grid
    return 1.5 * (Math.abs(x1 - x2) + Math.abs(y1 - y2)); // Weighted Manhattan distance
  }

  const distances = Array(cells.length).fill(Infinity);
  const prev = Array(cells.length).fill(null);
  distances[startIdx] = 0;

  const pq = [[startIdx, heuristic(startIdx, endIdx)]];
  const visitedOrder = [];
  const visited = new Set();

  while (pq.length > 0) {
    // Sort by priority (second element of each subarray)
    pq.sort((a, b) => a[1] - b[1]);
    const [currentIdx, currentDist] = pq.shift();

    if (visited.has(currentIdx)) continue;
    visited.add(currentIdx);
    visitedOrder.push(currentIdx);

    if (currentIdx === endIdx) break; // Exit early if end node is reached

    const neighbors = getNeighbors(currentIdx, rows, cols);
    for (const neighbor of neighbors) {
      if (
        visited.has(neighbor) ||
        cells[neighbor].classList.contains("obstacle")
      )
        continue;

      const newDist = distances[currentIdx] + 1;
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        prev[neighbor] = currentIdx;
        const priority = newDist + heuristic(neighbor, endIdx);
        pq.push([neighbor, priority]);
      }
    }
  }

  const path = [];
  let curr = endIdx;
  while (curr !== null && curr !== startIdx) {
    path.push(curr);
    curr = prev[curr];
  }
  if (curr === startIdx) path.push(startIdx); // Add the start node if path exists

  return { visitedOrder, path: path.reverse() };
}

// BFS Algorithm
function bfs(cells, startIdx, endIdx, rows, cols) {
  const queue = [startIdx];
  const visited = new Set([startIdx]);
  const prev = Array(cells.length).fill(null);
  const visitedOrder = [];

  while (queue.length > 0) {
    const currentIdx = queue.shift();
    visitedOrder.push(currentIdx);

    if (currentIdx === endIdx) break;

    const neighbors = getNeighbors(currentIdx, rows, cols);
    for (const neighbor of neighbors) {
      if (
        !visited.has(neighbor) &&
        !cells[neighbor].classList.contains("obstacle")
      ) {
        queue.push(neighbor);
        visited.add(neighbor);
        prev[neighbor] = currentIdx;
      }
    }
  }

  const path = [];
  let curr = endIdx;
  while (prev[curr] !== null) {
    path.push(curr);
    curr = prev[curr];
  }
  if (curr === startIdx) path.push(startIdx);
  return { visitedOrder, path: path.reverse() };
}

// DFS Algorithm
function dfs(cells, startIdx, endIdx, rows, cols) {
  const stack = [startIdx];
  const visited = new Set();
  const prev = Array(cells.length).fill(null);
  const visitedOrder = [];

  while (stack.length > 0) {
    const currentIdx = stack.pop();

    if (!visited.has(currentIdx)) {
      visited.add(currentIdx);
      visitedOrder.push(currentIdx);

      // Check if we reached the end node
      if (currentIdx === endIdx) break;

      const neighbors = getNeighbors(currentIdx, rows, cols);
      for (const neighbor of neighbors) {
        if (
          !visited.has(neighbor) &&
          !cells[neighbor].classList.contains("obstacle")
        ) {
          stack.push(neighbor);
          prev[neighbor] = currentIdx;
        }
      }
    }
  }

  const path = [];
  let curr = endIdx;
  while (prev[curr] !== null) {
    path.push(curr);
    curr = prev[curr];
  }
  if (curr === startIdx) path.push(startIdx);
  return { visitedOrder, path: path.reverse() };
}

// Helper Functions
function getNeighbors(idx, rows, cols) {
  const neighbors = [];
  const row = Math.floor(idx / cols);
  const col = idx % cols;

  if (row > 0) neighbors.push(idx - cols); // Up
  if (row < rows - 1) neighbors.push(idx + cols); // Down
  if (col > 0) neighbors.push(idx - 1); // Left
  if (col < cols - 1) neighbors.push(idx + 1); // Right

  return neighbors.filter((n) => n >= 0 && n < rows * cols);
}

function visualizeVisitedNodes(grid, visitedOrder, callback) {
  visitedOrder.forEach((idx, i) => {
    setTimeout(() => {
      const cell = grid[idx];
      if (
        !cell.classList.contains("start") &&
        !cell.classList.contains("end")
      ) {
        cell.classList.add("visited");
      }
      // When the last node is reached, call the callback to show the path
      if (i === visitedOrder.length - 1 && callback) {
        setTimeout(callback, 500); // Delay before showing the path
      }
    }, i * 30);
  });
}

function visualizePath(grid, path) {
  path.forEach((idx, i) => {
    setTimeout(() => {
      const cell = grid[idx];
      if (
        !cell.classList.contains("start") &&
        !cell.classList.contains("end")
      ) {
        cell.classList.add("path");
      }
    }, i * 50);
  });
}

document.getElementById("rec-div-maze-btn").addEventListener("click", () => {
  generateMazeRecursiveDivision(0, 0, cols, rows);
});

function generateMazeRecursiveDivision(
  xStart = 0,
  yStart = 0,
  width = cols,
  height = rows,
  minSize = 4
) {
  resetAllGrids(); // Clear previous grid

  // Helper function to apply obstacle to all grids
  function addObstacleToAllGrids(cellIndex) {
    Object.values(grids).forEach((grid) => {
      const cell = grid.children[cellIndex];
      if (cell) {
        cell.classList.add("obstacle");
      }
    });
  }

  // Recursive function to divide the grid
  function divide(x, y, width, height, orientation) {
    if (width < minSize || height < minSize) return;

    const horizontal = orientation === "horizontal";

    // Choose a random point to place the wall
    const wx = x + (horizontal ? 0 : Math.floor(Math.random() * (width - 2)));
    const wy = y + (horizontal ? Math.floor(Math.random() * (height - 2)) : 0);

    // Create a random gap in the wall
    const px = wx + (horizontal ? Math.floor(Math.random() * width) : 0);
    const py = wy + (horizontal ? 0 : Math.floor(Math.random() * height));

    const dx = horizontal ? 1 : 0;
    const dy = horizontal ? 0 : 1;

    const length = horizontal ? width : height;
    const wallLength = Math.floor(length * (0.6 + Math.random() * 0.4));

    // Draw the wall with a gap
    for (let i = 0; i < length; i++) {
      const wxIdx = wx + i * dx;
      const wyIdx = wy + i * dy;

      // Skip the gap point and ensure we are within bounds
      if (
        (wxIdx !== px || wyIdx !== py) &&
        wxIdx >= 0 &&
        wxIdx < cols &&
        wyIdx >= 0 &&
        wyIdx < rows &&
        Math.random() > 0.2
      ) {
        const cellIndex = wyIdx * cols + wxIdx;
        addObstacleToAllGrids(cellIndex);
      }
    }

    // Recursively divide the sections created by this wall
    const nx = x;
    const ny = y;
    const w1 = horizontal ? width : wx - x + 1;
    const h1 = horizontal ? wy - y + 1 : height;

    const nx2 = horizontal ? x : wx + 1;
    const ny2 = horizontal ? wy + 1 : y;
    const w2 = horizontal ? width : x + width - wx - 1;
    const h2 = horizontal ? y + height - wy - 1 : height;

    divide(nx, ny, w1, h1, chooseOrientation(w1, h1));
    divide(nx2, ny2, w2, h2, chooseOrientation(w2, h2));
  }

  // Determines whether to divide horizontally or vertically
  function chooseOrientation(width, height) {
    if (width < height) return "horizontal";
    if (height < width) return "vertical";
    return Math.random() > 0.5 ? "horizontal" : "vertical";
  }

  // Start division from the outer boundaries
  divide(xStart, yStart, width, height, chooseOrientation(width, height));
}
