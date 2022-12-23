window.addEventListener("load", () => {
    minesweeper.init();
});

const minesweeper = { // Avoids polluting the global namespace

    debug: false, // Set to true to enable console messages

    gameTypes: [
        { name: 'small', size: 9, mines: 10 },
        { name: 'medium', size: 16, mines: 40 },
        { name: 'large', size: 24, mines: 150 }
    ],

    // Builds the header
    buildHeader: function () {
        const header = document.createElement('header');

        const divHeader = document.createElement('div');
        header.appendChild(divHeader);
        divHeader.id = 'header-title';

        const heading1 = document.createElement('h1');
        divHeader.appendChild(heading1);
        heading1.innerText = 'Minesweeper';

        const paragraph = document.createElement('p');
        divHeader.appendChild(paragraph);
        paragraph.innerText = 'of Enrique Alejo Subías Melgar';

        return header;
    },

    // Builds the playfield
    buildPlayfield: function () {
        const divPlayfiled = document.createElement('div');
        divPlayfiled.id = 'playfield';

        return divPlayfiled;
    },

    // Builds the buttonbar
    buildButtons: function () {
        const divButtons = document.createElement('div');
        divButtons.id = 'buttons';

        const buttonSmall = this.buildButton('button', 'game-small', 'Small');
        divButtons.appendChild(buttonSmall);

        buttonSmall.addEventListener('click', () => {
            this.newGame("small");
            this.logic.init(this.size, this.mines)
        });

        const buttonMedium = this.buildButton('button', 'game-medium', 'Medium');
        divButtons.appendChild(buttonMedium);

        buttonMedium.addEventListener('click', () => {
            this.newGame('medium');
            this.logic.init(this.size, this.mines)
        });

        const buttonLarge = this.buildButton('button', 'game-large', 'Large');
        divButtons.appendChild(buttonLarge);

        buttonLarge.addEventListener('click', () => {
            this.newGame('large');
            this.logic.init(this.size, this.mines)
        });

        // Default game on first load
        this.newGame("small");
        this.logic.init(this.size, this.mines)

        return divButtons;
    },

    // Builds a single button
    buildButton: function (className, id, label) {
        const button = document.createElement('button');
        button.className = className;
        button.innerText = label;

        return button;
    },

    // Builds the footer
    buildFooter: function () {
        const footer = document.createElement('footer');

        const divFooter = document.createElement('div');
        footer.appendChild(divFooter);
        divFooter.id = 'footer-title';

        const paragraph = document.createElement('p');
        divFooter.appendChild(paragraph);
        paragraph.innerHTML = '&copy; 2022 by Enrique Alejo Subías Melgar';

        return footer;
    },

    gameType: function (size) {
        // for each
        for (let game = 0; game < this.gameTypes.length; game++) {
            if (this.gameTypes[game].name === size) {

                this.size = this.gameTypes[game].size;
                this.mines = this.gameTypes[game].mines;

                if (this.debug) {
                    console.log(this.gameTypes[game].name + ' game type selected')
                    console.log(this.gameTypes[game])
                }
            }
        }
    },

    // Starts a new game
    newGame: function (size) {
        this.generatePlayfield(size);
        // The program handles all clicks in a single callback per click type (Since each cell has data-x and data-y coordinates).
    },

    // Starts a new game and then initializes the playfield with the given size
    generatePlayfield: function (size) {

        this.gameType(size);

        if (this.debug) console.log('Generating playfield of size ' + this.size + 'x' + this.size + ' with ' + this.mines + ' mines')

        const playfield = document.querySelector('#playfield'); // Finds the playfield div

        playfield.innerHTML = ''; // Empties the playfield

        // Fills the new playfield with cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                playfield.appendChild(this.generateCell(i, j));
            }
        }

    },

    // Generates a single cell
    generateCell: function (row, colunm) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.className += ' covered';

        cell.dataset.x = colunm;
        cell.dataset.y = row;

        const style = `calc((100% / ${this.size}) - (2 * var(--shadowsize)))`;
        cell.style.width = style;
        cell.style.height = style;

        cell.addEventListener('click', (event) => {
            this.cellClick(event);
        });

        cell.addEventListener('contextmenu', (event) => {
            this.cellRightClick(event);
        });

        return cell;
    },

    cellClick: function (event) {
        // console.dir(event);
        const x = event.target.dataset.x;
        const y = event.target.dataset.y;
        event.preventDefault(); // Prevents this trigger from also triggering the right click event

        if (this.debug) console.log('Left click on cell ' + x + ',' + y + ' detected');

        const result = this.logic.sweep(x, y);
        if (this.debug) console.dir(result);

        this.placeSymbol(result, x, y);

        if (result.lose === true) {
            this.revealAllMines(result.minesList);
            event.target.classList.add('mineHit');
            this.displayOverlay('You lose');
        }

        if (result.win === true) {
            this.displayOverlay('You win');
        }
    },

    displayOverlay: function (message) {
        const playfield = document.querySelector('#playfield');

        const overlay = document.createElement('div');
        playfield.appendChild(overlay);
        // set a class to the overlay
        overlay.className = 'overlay';

        const textHolder = document.createElement('div');
        overlay.appendChild(textHolder);
        textHolder.innerText = message;
    },

    revealAllMines: function (minesList) {
        // Uncovers all mines in the playfield, used when the player loses
        for (let i = 0; i < minesList.length; i++) {
            const x = minesList[i].x;
            const y = minesList[i].y;
            const result = this.logic.sweep(x, y);
            this.placeSymbol(result, x, y);
        }
    },

    placeSymbol: function (result, x, y) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        cell.className = 'cell';

        // remove class covered
        cell.className = cell.className.replace('covered', '');

        if (result.mineHit === true) {
            cell.className += ' cell-symbol-bomb';
        }
        if (result.mineHit === false) {
            if (result.minesAround === 0) {

                for (let i = 0; i < result.emptyCells.length; i++) {
                    let neighbourCell = document.querySelector(`[data-x="${result.emptyCells[i].x}"][data-y="${result.emptyCells[i].y}"]`);
                    neighbourCell.className = 'cell';
                    // remove class covered
                    neighbourCell.className = neighbourCell.className.replace('covered', '');
                    neighbourCell.className += ' cell-symbol-' + result.emptyCells[i].minesAround;

                    if (result.emptyCells[i].minesAround === 0) {
                        neighbourCell.className += ' cell-symbol-0';
                    }
                    else {
                        neighbourCell.className += ' cell-symbol-' + result.emptyCells[i].minesAround;
                    }
                }
            }
            else {
                cell.className += ' cell-symbol-' + result.minesAround;
            }
        }

    },

    cellRightClick: function (event) {
        // console.dir(event);
        const x = event.target.dataset.x;
        const y = event.target.dataset.y;
        event.preventDefault(); // Prevents this trigger from also triggering the right click event

        if (this.debug) console.log('Right click on cell ' + x + ',' + y + ' detected');

        this.toggleFlag(x, y);
    },

    toggleFlag: function (x, y) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell.classList.contains('covered')) {
            if (cell.classList.contains('cell-symbol-flag')) {
                cell.classList.remove('cell-symbol-flag');
            } else {
                cell.className += ' cell-symbol-flag';
            }
        }
    },

    init: function () {

        this.logic = localLogic; // Sets the game logic to the local game logic object

        const body = document.querySelector('body'); // Finds the body element

        // Creates the main content div
        const content = document.createElement('div');
        body.appendChild(content);
        content.className = 'content';

        // header
        const header = this.buildHeader();
        content.appendChild(header);

        // div#playfield
        const divPlayfiled = this.buildPlayfield();
        content.appendChild(divPlayfiled);

        // div#buttonbar
        const divButtons = this.buildButtons();
        content.appendChild(divButtons);

        // footer
        const footer = this.buildFooter();
        content.appendChild(footer);
    }
}


const localLogic = {
    // Minesweeper local game logic

    //The game ends,
    // • when the user has uncovered all cells without a mine
    // • or has hit a mine

    // So the App has to track the number of uncovered cells.
    // If it equals the total number of cells minus the mine count, the user has won.

    sweep: function (x, y) {
        // This function sweeps the field for mines and is called when a cell is uncovered

        x = parseInt(x);
        y = parseInt(y);

        if (minesweeper.debug) console.log(this.movesCounter + ' moves made');

        if (this.movesCounter === 0) { // If this is the first move
            this.placeMines(x, y);
        }

        this.movesCounter += 1;

        this.uncoveredCells[x][y] = true; // Marks the cell as uncovered
        if (minesweeper.debug) console.log('1 cell uncovered');

        if (this.field[x][y] === true) {
            return { mineHit: true, minesList: this.collectMines(), lose: true };

        } else if (this.field[x][y] === false) {
            if (this.countMinesAround(x, y) > 0) {
                if (this.checkWin() === true) {
                    return { mineHit: false, minesAround: this.countMinesAround(x, y), emptyCells: undefined, win: true };
                }
                return { mineHit: false, minesAround: this.countMinesAround(x, y), emptyCells: undefined };
            }

            emtpyCellsList = this.getEmptyCells(x, y)
            let num = this.uncoverMultipleCells(emtpyCellsList);
            if (minesweeper.debug) console.log(num + ' cells uncovered');

            if (this.checkWin() === true) {
                return { mineHit: false, minesAround: this.countMinesAround(x, y), emptyCells: emtpyCellsList, win: true };
            }
            return { mineHit: false, minesAround: this.countMinesAround(x, y), emptyCells: emtpyCellsList };
        }

    },

    collectMines: function () {
        // This function collects all mines in the field and returns them as a list
        let minesList = [];

        for (let i = 0; i < this.field.length; i++) {
            for (let j = 0; j < this.field[i].length; j++) {
                if (this.field[i][j] == true) {
                    minesList.push({ x: i, y: j });
                }
            }
        }

        return minesList;
    },

    checkWin: function () {
        // This function checks if the user has won the game
        // Returns true if the user has won, false if not
        let coveredCells = 0;

        for (let i = 0; i < this.field.length; i++) {
            for (let j = 0; j < this.field[i].length; j++) {
                if (this.uncoveredCells[i][j] === false) {
                    coveredCells += 1;
                }
            }
        }

        if (coveredCells === this.numberOfMines) {
            return true;
        } else {
            return false;
        }
    },

    uncoverMultipleCells: function (emptyCellsList) {
        // This function uncovers multiple cells at once
        // It returns the number of uncovered cells
        let num = 0;

        for (let i = 0; i < emptyCellsList.length; i++) {
            let x = emptyCellsList[i].x;
            let y = emptyCellsList[i].y;

            if (this.uncoveredCells[x][y] === false) {
                this.uncoveredCells[x][y] = true;
                num += 1;
            }
        }
        return num;
    },

    countMinesAround: function (x, y) {
        // This function returns the number of mines around a cell
        let mines = 0;

        for (let delX = -1; delX <= 1; delX++) {
            for (let delY = -1; delY <= 1; delY++) {

                if (this.cellOutsideField(x + delX, y + delY)) {
                    continue; // If the cell is outside the field, skip it
                }

                if (this.field[x + delX][y + delY] === true) {
                    mines++; // If there is a mine, increase the number of mines
                }
            }
        }
        return mines;

    },

    cellOutsideField: function (x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return true; // If the cell is outside the field, return true
        } else {
            return false; // If the cell is inside the field, return false
        }
    },

    getEmptyCells: function (x, y) {
        // This function returns a list of cells around a empty cell,
        // which have no mines around or are neighbours of cells with no mines around

        let toDo = [];
        let done = [];
        toDo.push({ x: x, y: y, minesAround: 0 }); // Adds the first cell to the toDo list

        while (toDo.length != 0) { // While there are cells in the toDo list
            let currentCell = toDo.pop(); // Get the current cell from the end of the toDo list
            done.push(currentCell); // Add the current cell to the done list

            // Get a list of all neighbours of the current cell
            let neighbours = this.getNeighboursOf(currentCell.x, currentCell.y);

            // Loop through all neighbours
            for (let i = 0; i < neighbours.length; i++) {
                // If the neighbour is already in the done list, skip it
                if (this.cellInList(neighbours[i].x, neighbours[i].y, done)) {
                    continue;
                }
                // If the neighbour has mines around, add it to the done list
                if (neighbours[i].minesAround > 0) {
                    done.push(neighbours[i]);
                } else {
                    // If the neighbour has no mines around, add it to the toDo list
                    toDo.push(neighbours[i]);
                }
            }
        }
        return done;
    },

    getNeighboursOf: function (x, y) {
        // This function returns a list of all neighbours of a cell
        let neighbours = [];
        for (let delX = -1; delX <= 1; delX++) {
            for (let delY = -1; delY <= 1; delY++) {

                if (this.cellOutsideField(x + delX, y + delY)) {
                    continue; // If the cell is outside the field, skip it
                }
                if (delX === 0 && delY === 0) {
                    continue; // If the cell is the current cell, skip it
                }
                neighbours.push({ x: x + delX, y: y + delY, minesAround: this.countMinesAround(x + delX, y + delY) });
            }
        }
        return neighbours;
    },

    cellInList: function (x, y, list) {
        // This function checks if a cell is in a list
        for (let i = 0; i < list.length; i++) {
            if (list[i].x === x && list[i].y === y) {
                return true;
            }
        }
        return false;
    },

    placeMines: function (x, y) {
        // This function places the mines on the field
        // It takes the coordinates of the first click as parameters
        // It places the mines in a way that the first click is always safe

        // Infinite loop that breaks when all mines are placed
        this.minesLeft = this.numberOfMines;
        while (true) {
            const tryX = Math.floor(Math.random() * this.size);
            const tryY = Math.floor(Math.random() * this.size);

            if (tryX === x && tryY === y) {
                continue; // If the coordinates are the same as the first click, try again
            }

            if (this.field[tryX][tryY] === true) {
                continue; // If there is already a mine there, try again
            }

            this.field[tryX][tryY] = true; // Place a mine
            this.minesLeft--; // Decrease the number of mines left

            if (this.minesLeft === 0) {
                break; // If all mines are placed, break the loop
            }
        }

        if (minesweeper.debug) console.dir(this.field);

    },

    init: function (size, numberOfMines) {
        console.log('Local game logic initialized with a size of ' + size + ' x ' + size + ' and ' + numberOfMines + ' mines');

        this.size = size;
        this.numberOfMines = numberOfMines;

        // This field is where the game logic object stores the mines in:
        this.field = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            this.field[i] = new Array(this.size);
            for (let j = 0; j < this.size; j++) {
                this.field[i][j] = false; // False means no mine
            }
        }
        if (minesweeper.debug) {
            console.log('Field initialized: ')
            console.dir(this.field);
        }

        // uncoveredCells array of the size of the field
        this.uncoveredCells = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            this.uncoveredCells[i] = new Array(this.size);
            for (let j = 0; j < this.size; j++) {
                this.uncoveredCells[i][j] = false; // False means the cell is covered
            }
        }
        if (minesweeper.debug) {
            console.log('Uncovered cells initialized: ')
            console.dir(this.uncoveredCells);
        }

        // Delay the initialization of the mines until the first click

        // Initialize the move counter
        this.movesCounter = 0;
    }
}
