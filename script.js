const grid = document.getElementById('grid');
const rows = 20;
const cols = 20;
let isStartSelected = false;
let isEndSelected = false;
let startCell, endCell;

// // Create the grid and add event listeners for each cell
// for (let i = 0; i < rows * cols; i++) {
//     const cell = document.createElement('div');
//     cell.classList.add('cell');
//     cell.addEventListener('click', () => handleCellClick(cell));
//     grid.appendChild(cell);
// }

// function handleCellClick(cell) {
//     if (!isStartSelected) {
//         cell.classList.add('start');
//         isStartSelected = true;
//         startCell = cell;
//     } else if (!isEndSelected && cell !== startCell) {
//         cell.classList.add('end');
//         isEndSelected = true;
//         endCell = cell;
//     } else if (cell !== startCell && cell !== endCell) {
//         cell.classList.toggle('obstacle');
//     }
// }

let isMouseDown = false;
let isClearMode = false; // Flag to indicate whether the clear mode is active

// Add event listeners for keydown and keyup to toggle clear mode
document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
        isClearMode = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
        isClearMode = false;
    }
});

// Create the grid and add event listeners for each cell
for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');

    cell.addEventListener('mousedown', () => {
        isMouseDown = true;
        handleCellInteraction(cell);
    });

    cell.addEventListener('mousemove', () => {
        if (isMouseDown) {
            handleCellInteraction(cell);
        }
    });

    cell.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    grid.appendChild(cell);
}

// Handle global mouseup event to stop dragging outside of grid cells
document.addEventListener('mouseup', () => {
    isMouseDown = false;
});

function handleCellInteraction(cell) {
    if (!isStartSelected) {
        cell.classList.add('start');
        isStartSelected = true;
        startCell = cell;
    } else if (!isEndSelected && cell !== startCell) {
        cell.classList.add('end');
        isEndSelected = true;
        endCell = cell;
    } else if (cell !== startCell && cell !== endCell) {
        if (isClearMode) {
            cell.classList.remove('obstacle');
        } else {
            cell.classList.add('obstacle');
        }
    }
}


document.getElementById('start-btn').addEventListener('click', () => {
    if (startCell && endCell) {
        const startIdx = Array.from(grid.children).indexOf(startCell);
        const endIdx = Array.from(grid.children).indexOf(endCell);
        const algorithm = document.getElementById('algorithm-select').value;

        let result;
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

        const { visitedOrder, path } = result;

        // Visualize visited nodes first
        visualizeVisitedNodes(visitedOrder, () => {
            visualizePath(path);
        });
    }
});

// document.getElementById('reset-btn').addEventListener('click', resetGrid);

// function resetGrid() {
//     Array.from(grid.children).forEach(cell => {
//         cell.classList.remove('obstacle', 'start', 'end', 'visited', 'path');
//     });
//     isStartSelected = false;
//     isEndSelected = false;
// }

// Existing code for general reset
document.getElementById('reset-btn').addEventListener('click', resetGrid);

// New code for path-only reset
document.getElementById('reset-path-btn').addEventListener('click', resetPathOnly);

function resetGrid() {
    Array.from(grid.children).forEach(cell => {
        cell.classList.remove('obstacle', 'start', 'end', 'visited', 'path');
    });
    isStartSelected = false;
    isEndSelected = false;
}

// New function to reset only the path and visited cells
function resetPathOnly() {
    Array.from(grid.children).forEach(cell => {
        cell.classList.remove('visited', 'path');
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
            if (!visited.has(neighbor) && !cells[neighbor].classList.contains('obstacle')) {
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

// A* Algorithm
function aStar(cells, startIdx, endIdx, rows, cols) {
    function heuristic(a, b) {
        const [x1, y1] = [Math.floor(a / cols), a % cols];
        const [x2, y2] = [Math.floor(b / cols), b % cols];
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

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
            if (!visited.has(neighbor) && !cells[neighbor].classList.contains('obstacle')) {
                const newDist = distances[currentIdx] + 1;
                if (newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    prev[neighbor] = currentIdx;
                    const priority = newDist + heuristic(neighbor, endIdx);
                    pq.push([neighbor, priority]);
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
            if (!visited.has(neighbor) && !cells[neighbor].classList.contains('obstacle')) {
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
                if (!visited.has(neighbor) && !cells[neighbor].classList.contains('obstacle')) {
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

    return neighbors.filter(n => n >= 0 && n < rows * cols);
}

function visualizeVisitedNodes(visitedOrder, callback) {
    visitedOrder.forEach((idx, i) => {
        setTimeout(() => {
            const cell = grid.children[idx];
            if (!cell.classList.contains('start') && !cell.classList.contains('end')) {
                cell.classList.add('visited');
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
            grid.children[idx].classList.add('path');
        }, i * 100);
    });
}