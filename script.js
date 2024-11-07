const grid = document.getElementById("grid");
var rows = 20;
var cols = 20;
let isStartSelected = false;
let isEndSelected = false;
let startCell, endCell;

let isMouseDown = false;
let isClearMode = false; // Flag to indicate whether the clear mode is active

// Add event listeners for keydown and keyup to toggle clear mode
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") {
    isClearMode = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    isClearMode = false;
  }
});

const gridElement = document.getElementById("grid");
const rowsInput = document.getElementById("rows-input");
const columnsInput = document.getElementById("columns-input");
const applyGridSizeBtn = document.getElementById("apply-grid-size-btn");

function createGrid() {
  gridElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  gridElement.innerHTML = ""; // Clear the existing grid

  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    cell.addEventListener("mousedown", () => {
      isMouseDown = true;
      handleCellInteraction(cell);
    });

    cell.addEventListener("mousemove", () => {
      if (isMouseDown) {
        handleCellInteraction(cell);
      }
    });

    cell.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    grid.appendChild(cell);
  }
}

// Initial grid setup
createGrid(20, 20);

// Apply new grid size when the button is clicked
applyGridSizeBtn.addEventListener("click", () => {
  rows = parseInt(rowsInput.value, 10);
  cols = parseInt(columnsInput.value, 10);
  createGrid();
});

// Handle global mouseup event to stop dragging outside of grid cells
document.addEventListener("mouseup", () => {
  isMouseDown = false;
});

function handleCellInteraction(cell) {
  if (!isStartSelected) {
    cell.classList.add("start");
    isStartSelected = true;
    startCell = cell;
  } else if (!isEndSelected && cell !== startCell) {
    cell.classList.add("end");
    isEndSelected = true;
    endCell = cell;
  } else if (cell !== startCell && cell !== endCell) {
    if (isClearMode) {
      cell.classList.remove("obstacle");
    } else {
      cell.classList.add("obstacle");
    }
  }
}

document.getElementById("start-btn").addEventListener("click", () => {
  resetPathOnly();
  if (startCell && endCell) {
    const startIdx = Array.from(grid.children).indexOf(startCell);
    const endIdx = Array.from(grid.children).indexOf(endCell);
    const algorithm = document.getElementById("algorithm-select").value;

    let result;
    startTimer(); // Start the timer before the algorithm
    switch (algorithm) {
      case "dijkstra":
        result = dijkstra(grid.children, startIdx, endIdx, rows, cols);
        break;
      case "astar":
        result = aStar(grid.children, startIdx, endIdx, rows, cols);
        break;
      case "bfs":
        result = bfs(grid.children, startIdx, endIdx, rows, cols);
        break;
      case "dfs":
        result = dfs(grid.children, startIdx, endIdx, rows, cols);
        break;
      default:
        console.error("Invalid algorithm selected");
        return;
    }
    stopTimer(); // Stop the timer after the algorithm finishes

    const { visitedOrder, path } = result;

    // Visualize visited nodes first
    visualizeVisitedNodes(visitedOrder, () => {
      if (
        path.length === 0 ||
        path[0] !== startIdx ||
        path[path.length - 1] !== endIdx
      ) {
        alert("No path found from the start to the end node.");
      } else {
        visualizePath(path);
      }
    });
  }
});

// Existing code for general reset
document.getElementById("reset-btn").addEventListener("click", resetGrid);

// New code for path-only reset
document
  .getElementById("reset-path-btn")
  .addEventListener("click", resetPathOnly);

function resetGrid() {
  Array.from(grid.children).forEach((cell) => {
    cell.classList.remove("obstacle", "start", "end", "visited", "path");
  });
  isStartSelected = false;
  isEndSelected = false;
}

// New function to reset only the path and visited cells
function resetPathOnly() {
  Array.from(grid.children).forEach((cell) => {
    cell.classList.remove("visited", "path");
  });
}

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

let startTime, endTime;

// Function to start the timer
function startTimer() {
  startTime = performance.now(); // Capture the start time
}

// Function to stop the timer and show the elapsed time
function stopTimer() {
  endTime = performance.now(); // Capture the end time
  const elapsedTime = (endTime - startTime).toFixed(2); // Calculate time in milliseconds
  document.getElementById("timer").innerText = `Time Taken: ${elapsedTime} ms`; // Display time
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

function visualizeVisitedNodes(visitedOrder, callback) {
  visitedOrder.forEach((idx, i) => {
    setTimeout(() => {
      const cell = grid.children[idx];
      if (
        !cell.classList.contains("start") &&
        !cell.classList.contains("end")
      ) {
        cell.classList.add("visited");
      }
      if (i === visitedOrder.length - 1 && callback) {
        setTimeout(callback, 500); // Delay before showing the path
      }
    }, i * 30);
  });
}

function visualizePath(path) {
  path.forEach((idx, i) => {
    setTimeout(() => {
      grid.children[idx].classList.add("path");
    }, i * 100);
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
  resetGrid(); // Clear previous grid

  function divide(x, y, width, height, orientation) {
    // Base case: Stop dividing if width or height is too small
    if (width < minSize || height < minSize) return;

    // Randomly skip creating some divisions to create more open spaces
    // if (Math.random() < 0.05) return;

    const horizontal = orientation === "horizontal";

    // Choose a random point to place the wall within the allowable bounds
    const wx = x + (horizontal ? 0 : Math.floor(Math.random() * (width - 2)));
    const wy = y + (horizontal ? Math.floor(Math.random() * (height - 2)) : 0);

    // Create a random gap in the wall
    const px = wx + (horizontal ? Math.floor(Math.random() * width) : 0);
    const py = wy + (horizontal ? 0 : Math.floor(Math.random() * height));

    // Determine wall direction and length
    const dx = horizontal ? 1 : 0;
    const dy = horizontal ? 0 : 1;

    // Randomize the wall length to reduce density
    const length = horizontal ? width : height;
    const wallLength = Math.floor(length * (0.6 + Math.random() * 0.4));

    // Draw the wall with a gap
    for (let i = 0; i < length; i++) {
      // Randomly skip some wall cells to create larger gaps
      if ((wx + i * dx !== px || wy + i * dy !== py) && Math.random() > 0.2) {
        const idx = (wy + i * dy) * cols + (wx + i * dx);
        grid.children[idx].classList.add("obstacle");
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

  function chooseOrientation(width, height) {
    if (width < height) return "horizontal";
    if (height < width) return "vertical";
    return Math.random() > 0.5 ? "horizontal" : "vertical";
  }

  // Start division from the outer boundaries
  divide(xStart, yStart, width, height, chooseOrientation(width, height));
}