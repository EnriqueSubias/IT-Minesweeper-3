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
    buildButtons: async function () {
        const divButtons = document.createElement('div');
        divButtons.id = 'buttons';

        const buttonSmall = this.buildButton('button', 'game-small', 'Small');
        divButtons.appendChild(buttonSmall);

        buttonSmall.addEventListener('click', async () => {
            this.newGame("small");
            await this.logic.init(this.size, this.mines)
        });

        const buttonMedium = this.buildButton('button', 'game-medium', 'Medium');
        divButtons.appendChild(buttonMedium);

        buttonMedium.addEventListener('click', async () => {
            this.newGame('medium');
            await this.logic.init(this.size, this.mines)
        });

        const buttonLarge = this.buildButton('button', 'game-large', 'Large');
        divButtons.appendChild(buttonLarge);

        buttonLarge.addEventListener('click', async () => {
            this.newGame('large');
            await this.logic.init(this.size, this.mines)
        });

        // Default game on first load
        this.newGame("small");
        await this.logic.init(this.size, this.mines)

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
    newGame: async function (size) {
        await this.generatePlayfield(size);
        // The program handles all clicks in a single callback per click type (Since each cell has data-x and data-y coordinates).
    },

    // Starts a new game and then initializes the playfield with the given size
    generatePlayfield: async function (size) {

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

    cellClick: async function (event) {
        // console.dir(event);
        const x = event.target.dataset.x;
        const y = event.target.dataset.y;
        event.preventDefault(); // Prevents this trigger from also triggering the right click event

        if (this.debug) console.log('Left click on cell ' + x + ',' + y + ' detected');

        const result = await this.logic.sweep(x, y);
        if (this.debug) console.dir(result);

        this.placeSymbol(result, x, y);

        if (result.minehit === true) {
            this.revealAllMines(result);
            event.target.classList.add('mineHit');
            this.displayOverlay('You lose');
        }

        if (result.userwins === true) {
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

    revealAllMines: async function (result) {
        // Uncovers all mines in the playfield, used when the player loses
        for (let i = 0; i < result.mines.length; i++) {
            const x = result.mines[i].x;
            const y = result.mines[i].y;
            this.placeSymbol(result, x, y);
        }
    },

    placeSymbol: async function (result, x, y) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        cell.className = 'cell';

        // remove class covered
        cell.className = cell.className.replace('covered', '');

        if (result.minehit === true) {
            cell.className += ' cell-symbol-bomb';
        }
        if (result.minehit === false) {
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

    init: async function () {

        this.logic = remoteLogic; // Sets the game logic to the remote game logic object

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
        const divButtons = await this.buildButtons();
        content.appendChild(divButtons);

        // footer
        const footer = this.buildFooter();
        content.appendChild(footer);
    }
}

const remoteLogic = {
    // Minesweeper remote game logic

    serverUrl: 'https://www2.hs-esslingen.de/~melcher/internet-technologien/minesweeper/', // The URL of the server
    var: token = null,

    sweep: async function (x, y) {
        // Remote sweep function
        const request = '?request=sweep' + '&token=' + this.token + '&x=' + x + '&y=' + y;
        return await this.fetchAndDecode(request);
    },

    fetchAndDecode: async function (query) {
        // This function fetches a url and returns the decoded json response
        console.log('Fetch: ' + this.serverUrl + query)
        const response = await fetch(this.serverUrl + query);
        return await response.json();
    },

    init: async function (size, numberOfMines) {
        // This function initializes the game, storing the togen given by the server
        const userid = 'ensuit00';
        const request = '?request=init&userid=' + userid + '&size=' + size + '&mines=' + numberOfMines;
        const response = await this.fetchAndDecode(request);

        this.token = response.token; // Save the token
        console.log('Token: ' + this.token);
    }

}
