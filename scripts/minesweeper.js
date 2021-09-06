
/**
 * The Board class represents the minesweeper board and holds the contents of all cells.
 * It's `stateless` in the sense that it only holds the values of the cells and dimensions of the board.
 */
export class Board {
    constructor(w, h, n) {        
        if (w < 1 || h < 1 || n < 1) throw new Error(`invalid args`);

        this.width = w;
        this.height = h;
        
        this.mines = n;
        if (n > (w * h)) {
            console.error(`Everything is mine`);
            this.mines = (w * h);
        }
        
        this.mineSymbol = '*';
        
        this.generate();
    }

    _countMines(row, col) {
        let count = 0;
        
        // Rows above and below:
        [col - 1, col, col + 1].forEach(c => {
            if (this._isMine(row - 1, c)) count++;
            if (this._isMine(row + 1, c)) count++;
        });

        // Left and Right Cells:
        if (this._isMine(row, col - 1)) count++;
        if (this._isMine(row, col + 1)) count++;

        return count;
    }
    
    _isMine(row, col) {
        return row >= 0 && row < this.height && col >= 0 && col < this.width ? this.grid[row][col] === this.mineSymbol : false;
    }
    
    _printGrid() {
        for (let r = 0; r < this.height; r++) {
            console.log(this.grid[r]);
        }
    }
    
    _clearBoard() {
        this.grid = [];
        for (let i = 0; i < this.height; i++) this.grid.push(Array(this.width).fill('0'));
    }

    generate() {
        this._clearBoard();

        const w = this.width;
        const h = this.height;
        const n = this.mines; 
        
        // Generate mines
        const numCells = w * h;
        const cells = [...Array(numCells).keys()];
        for (let i = 0; i < n; i++) { 
            const rand = Math.floor(Math.random() * cells.length);
            const pos = cells.splice(rand, 1)[0];
            const row = Math.floor(pos / w);
            const col = pos % w;
            this.grid[row][col] = this.mineSymbol;
        }	
    
        // Fill out rest of grid based on mines:
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                if (this.grid[r][c] === this.mineSymbol) continue;
                this.grid[r][c] = Number(this._countMines(r, c)).toString();	
            }
        }
    }
    validPos(r, c) {
        return r >= 0 && r < this.height && c >= 0 && c <= this.width;
    }
    
    /** 
     * Returns a 'minesweeper island' about a cell 'c' (at row 'r' and column 'c').
     * The mantle of the island is the graph of all neighboring (horizontal and vertical) '0's from given location
     *      Eg: Given a board of values:
     *          [0, 0, 1, *]
     *          [0, 0, 1, 1]
     *      The inner island is Array<(r,c)> = [[0,0], [0, 1], [1, 0], [1, 1]]
     * The crust of the island is the set of all non-zero bordering the inside of the island(horizontally, vertically, diagonally)
     * In this case it would be Array<(r,c)> = [[0,2], [1,2]]
     * The returned minesweeper island is the 'mantle' + 'crust'
     * 
     * @param {Number} r - row
     * @param {Number} c - column
     * @returns {Array} returns an array containing all elements of the island. Each element in the array is of format [row, column, value]
     */
    getIsland(r, c) {
        const island = [];            
        const toVisit = [];
        const visited = {};

        if (this.grid[r][c] === "0") {
            toVisit.push([r, c]);
        } else {
            console.warn(`Non zero value at row ${r} col ${c}... Returning empty island.`);
        }
        
        while(toVisit.length > 0) {
            // Visiting element:
            const v = toVisit.shift();
            const vr = v[0];
            const vc = v[1];
            if (vr < 0 || vr >= this.height || vc < 0 || vc >= this.width) continue; // Out of bounds check
            const vv = this.grid[vr][vc];

            // Check if visited
            if (visited[vr] && visited[vr][vc]) continue;

            // Visit 
            if (visited[vr] == null) visited[vr] = {};
            visited[vr][vc] = true;

            // Add to island
            island.push([vr, vc, vv]);

            // Add neighbors.
            if (vv !== "0") continue; // We only want to want to keep exploring for '0' nodes
            toVisit.push(
                [vr - 1, vc], [vr + 1, vc], //horizontal
                [vr, vc - 1], [vr, vc + 1], //vertical
                [vr + 1, vc + 1], [vr + 1, vc - 1], [vr - 1, vc + 1], [vr - 1, vc - 1] // diagonal
            );
        }

        return island;
    }

}

export const ClickResult = Object.freeze({"MINE": 0, "NUMBER": 1, "ZERO": 2});

export class Game {
    constructor(board) {
        this.board = board;
    }

    start() {
        if (this.board == null) {
            console.error(`Board not set!`);
            return;
        }

        // Generate the board:
        this.board.generate();
    }
    
    // hit a mine => game over, hit a numbered cell => return number, hit a 0, return all adjacent zeros'
    click(r, c) {
        const v = this.board.grid[r][c];
        switch(v) {
            case this.board.mineSymbol:
                return { res: ClickResult.MINE, data: null };
            case "0":
                return { res: ClickResult.ZERO, data: this.board.getIsland(r, c) };
            default:
                return { res: ClickResult.NUMBER, data: v };
        }
    }
    
}

export class GameFactory {
    static createGame(w, h, numMines) {
        let board = new Board(w, h, numMines);
        let game = new Game(board);
        return game;
    }
}

/**
 * SpriteBlob is a convenience class which stores information we need
 */
export class SpriteBlob {
    constructor(sprite, content, flag, r, c) {
        this.clickableSprite = sprite; // sprite which is clicked to display content
        this.contentSprite = content; // 
        this.flagSprite = flag;
        this.row = r;
        this.column = c;
        this.clicked = false;
        this.flagged = false;
    }
}
