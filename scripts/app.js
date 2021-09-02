/**
 * Author: Janarth Kumaresan
 * 
 * High level todos:
 *      - remove all those dumb console messages:
 */

import {Board, ClickResult, Game, GameFactory} from './minesweeper.js'

/**
 * Constants
 */
const debug_mode = true;

const board_width = 10;
const board_height = 8;
const num_mines = 10;

const cell_length_px = 50;

const app_width = cell_length_px * board_width;
const app_height = cell_length_px * board_height;

/**
 * Game Globals:
 */

let pixiResources;

const textureNameToPath = {
    'unknown': './assets/unknown-cell.png',
    'light_blue': './assets/light-blue-cell.png',
    'dark_blue': './assets/dark-blue-cell.png',
    'game_over_loss_banner': './assets/game-over-loss-banner.png',
    'retry': './assets/retry.png',
    'quit': './assets/quit.png'
}

// Create game class:
const game = GameFactory.createGame(board_width, board_height, num_mines);

/**
 * Setup PIXI:
 */

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({
    width: app_width,
    height: app_height,
    backgroundColor: 0xb2dcff
});

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

/**
 * Functions
 */

/**
 * Resets the cell layer by cleaning up the sprites and all listeners.
 */
function resetCellLayer(cellLayer) {
    console.log("Game over my son!!!");

    // Clearing 
    cellLayer.visible = false;

    // Clear all listeners....
    cellLayer.children.forEach(c => c.removeAllListeners('pointerdown'));
    console.log(`cleared all listeners`);

    // Remove all children
    cellLayer.removeChildren();

    cellLayer.visible = true;
}

 /**
  * Performs setup for the game
  */
 function startGame() {

    // Start the game (via the game object)
    game.start();

    // Alias for pixi resources
    const resources = pixiResources;

    const cellLayer = app.stage.getChildByName('cellLayer');

    // Create Cell Sprites:
    for (let y = 0; y < board_height; y++) {
        spriteMap[y] = {};
        for (let x = 0; x < board_width; x++) {

            const texture = (x + y) % 2 === 0 ? resources.light_blue.texture : resources.dark_blue.texture;

            const cell = new PIXI.Sprite(texture);
            
            // Add cell to spriteMap
            spriteMap[y][x] = cell;

            // Setup the position
            cell.width = cell_length_px;
            cell.height = cell_length_px;
        
            // Rotate around the center
            cell.anchor.x = 0;
            cell.anchor.y = 0;
        
            cell.x = x * cell_length_px;
            cell.y = y * cell_length_px;
        
            // Opt-in to interactivity
            cell.interactive = true;

            // Shows hand cursor
            cell.buttonMode = true;

            // Add the cell to the scene we are building
            cellLayer.addChild(cell);
    
        }
    }


    // Add Click Listeners on each sprite:
    for (let y = 0; y < board_height; y++) {
        for (let x = 0; x < board_width; x++) {
            const cell = spriteMap[y][x];

            cell.once('pointerdown', () => {

                // Store click result:
                const clickReturn = game.click(y, x);
                const res = clickReturn.res;
                const data = clickReturn.data;

                // Debug block:
                if (debug_mode) {
                    switch (res) {
                        case ClickResult.MINE:
                            console.log(`Hit a MINE on row ${y} on column ${x}!`);
                            break;
                        case ClickResult.NUMBER:
                            console.log(`Hit a Number ${data} ${y} on column ${x}!`);
                            break;
                        case ClickResult.ZERO:
                            console.log(`Hit an island on row ${y} on column ${x}! Cells`);
                            console.log(data);
                    }
                }

                if ( res === ClickResult.MINE ) {
                    // Game over:
                    setTimeout(() => {
                        resetCellLayer(cellLayer);
                        const gameOverLossContainer = app.stage.getChildByName('gameOverLoss');
                        gameOverLossContainer.visible = true;
                    });

                } else if ( res === ClickResult.ZERO ) {
                    // Emit a click for each cell in the island
                    const coordToClick = data;
                    coordToClick.forEach(coordSet => {
                        const row = coordSet[0];
                        const col = coordSet[1];
                        spriteMap[row][col].emit('pointerdown');
                    });
                    let text = '0'; 
                    const clickedCell = new PIXI.Text(text);
                    clickedCell.width = cell_length_px;
                    clickedCell.height = cell_length_px;                
                    clickedCell.anchor.x = 0;
                    clickedCell.anchor.y = 0;
                    clickedCell.x = x * cell_length_px;
                    clickedCell.y = y * cell_length_px;
                    cellLayer.addChild(clickedCell);
                } else {
                    let text = data || '*'; // it's a number or it's a mine.
                    const clickedCell = new PIXI.Text(text);
                    clickedCell.width = cell_length_px;
                    clickedCell.height = cell_length_px;                
                    clickedCell.anchor.x = 0;
                    clickedCell.anchor.y = 0;
                    clickedCell.x = x * cell_length_px;
                    clickedCell.y = y * cell_length_px;
                    cellLayer.addChild(clickedCell);
                    console.log('Added our symbol!!!');
                }

                // Disable interactivity and click handling                
                cell.interactive = false;
                cell.buttonMode = false;
            });

        }
    }
}

 /**
 * Creates the 'Game Over Loss' container and all children!
 * @param {*} resources 
 */
function populateGameOverLossContainer(resources, stage) {
    const gameOverLoss = stage.getChildByName('gameOverLoss');
    if (gameOverLoss == null) {
        console.error(`Couldn't resolve game over loss container!`);
        return;
    }

    // Configure Game Over Loss container
    gameOverLoss.visible = false;
    gameOverLoss.x = app_width / 2;
    gameOverLoss.y = app_height / 2;

    // Setup gameOverLoss container:
    const banner = new PIXI.Sprite(resources.game_over_loss_banner.texture);
    banner.anchor.x = 0.5;
    banner.anchor.y = 0.5;
    // todo scale so that it doesn't overflow!
    gameOverLoss.addChild(banner);

    // Add Retry Button
    const retry = new PIXI.Sprite(resources.retry.texture);
    retry.anchor.x = 0.5;
    retry.anchor.y = 0.5;
    retry.x = -100;
    retry.y = 125;
    retry.interactive = true;
    retry.buttonMode = true;
    retry.on('pointerdown', () => {
        console.log(`lmao it's not implemented yet hahaha noooooooooooobeeeeeee`);
        gameOverLoss.visible = false; 
        startGame();
    });
    gameOverLoss.addChild(retry);

    // Add Quit Button
    const quit = new PIXI.Sprite(resources.quit.texture);
    quit.anchor.x = 0.5;
    quit.anchor.y = 0.5;
    quit.x = 100;
    quit.y = 125;
    quit.interactive = true;
    quit.buttonMode = true;
    quit.on('pointerdown', () => {
        console.log(`lmao you gave up? Get out of my sight seriously.`);
    });
    gameOverLoss.addChild(quit);
}

/**
 * Main
 */


// Add textures to loader to be loaded:
Object.keys(textureNameToPath).forEach(name => app.loader.add(name, textureNameToPath[name]));

// spriteMap[y][x] gets you the clickable sprite at that cell
const spriteMap = {};

// Create Layer for Cells
const cellLayer = new PIXI.Container();
cellLayer.name = 'cellLayer'
app.stage.addChild(cellLayer);

// Create Game Over Loss Container:
const gameOverLoss = new PIXI.Container();
gameOverLoss.name = 'gameOverLoss'
app.stage.addChild(gameOverLoss);

app.loader.load((loader, resources) => {
    // Save resources for use later:
    pixiResources = resources;

    // Populate game over loss screen:
    populateGameOverLossContainer(resources, app.stage);

    // Start the game
    startGame();
});

