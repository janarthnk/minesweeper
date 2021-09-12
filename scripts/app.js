/**
 * Author: Janarth Kumaresan
 * 
 * High level todos:
 *      - remove all those dumb console messages:
 */

import {Board, ClickResult, Game, GameFactory, SpriteBlob} from './minesweeper.js'

/**
 * Constants
 */
const debug_mode = true;

/**
 * Modes (w,h,m):
 *  Easy (10, 8, 10)
 *  Hard (24, 20, 99)
 */
const board_width = 10;
const board_height = 8;
const num_mines = 10;

const cell_length_px = 50;

const app_width = cell_length_px * board_width;
const app_height = cell_length_px * board_height;

const blobMap = new Map();

/**
 * Game Globals:
 */

let pixiResources;

const textureNameToPath = {
    'unknown': './assets/unknown-cell.png',
    'light_blue':'./assets/amber/unknown_light.png',
    'dark_blue': './assets/amber/unknown_dark.png',
    'game_over_loss_banner': './assets/game-over-loss-banner.png',
    'retry': './assets/retry.png',
    'quit': './assets/quit.png',
    'flag': './assets/amber/flag.png',
    'flag_light': './assets/amber/flag_light.png',
    'flag_dark': './assets/amber/flag_dark.png',
    'victory_banner': './assets/victory-banner.png',
    'cell_0_light': './assets/amber/light.png',
    'cell_1_light':  './assets/amber/1_light.png',
    'cell_2_light':  './assets/amber/2_light.png',
    'cell_3_light':  './assets/amber/3_light.png',
    'cell_4_light':  './assets/amber/4_light.png',
    'cell_5_light':  './assets/amber/5_light.png',
    'cell_6_light':  './assets/amber/6_light.png',
    'cell_7_light':  './assets/amber/7_light.png',
    'cell_8_light':  './assets/amber/8_light.png',
    'cell_0_dark': './assets/amber/dark.png',
    'cell_1_dark':  './assets/amber/1_dark.png',
    'cell_2_dark':  './assets/amber/2_dark.png',
    'cell_3_dark':  './assets/amber/3_dark.png',
    'cell_4_dark':  './assets/amber/4_dark.png',
    'cell_5_dark':  './assets/amber/5_dark.png',
    'cell_6_dark':  './assets/amber/6_dark.png',
    'cell_7_dark':  './assets/amber/7_dark.png',
    'cell_8_dark':  './assets/amber/8_dark.png',
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

// Disable right click context menu
app.view.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

/**
 * Functions
 */
function showVictory() {
    console.log(`Congrats you won!`);
    resetCellLayer();
    const gameOverWinContainer = app.stage.getChildByName('gameOverWin');
    gameOverWinContainer.visible = true;
}
/**
 * Resets the cell layer by cleaning up the sprites and all listeners.
 */
function resetCellLayer() {
    const cellLayer = app.stage.getChildByName('cellLayer');

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
 * Show the cell content, mark the cell as clicked, stop listening for click events on it...
 */
function showCell(blob) {
    if (blob.clicked) return; // already clicked

    blob.clicked = true; // Set clicked to true.
    game.numClicked++;

    // Hide any flags...
    if (blob.flagged) game.numFlagged--;
    blob.flagged = false;
    blob.flagSprite.visible = false;
    
    const cell = blob.clickableSprite;
    // Cell can no longer be clicked: disable interactivity and click handling  
    cell.off('pointerdown', handleCellClick);
    cell.interactive = false;
    cell.buttonMode = false;

    blob.contentSprite.visible = true;
}

function handleCellLeftClick(blob) {
    
    if (blob.clicked) return; // Already clicked peace out:
    if (blob.flagged) return; // If it's flagged it cannot be clicked

    showCell(blob);

    // Store click result:
    const y = blob.row;
    const x = blob.column;
    const clickReturn = game.click(y, x);
    const res = clickReturn.res;
    const data = clickReturn.data;

    // Handle Click Type:
    if ( res === ClickResult.MINE ) {
        // Game over:
        setTimeout(() => {
            resetCellLayer();
            const gameOverLossContainer = app.stage.getChildByName('gameOverLoss');
            gameOverLossContainer.visible = true;
        });
    } else if ( res === ClickResult.ZERO ) {
        // Emit a click for each cell in the island
        const coordToClick = data;
        coordToClick.forEach(coordSet => {
            const row = coordSet[0];
            const col = coordSet[1];
            const cell = spriteMap[row][col];
            const cellBlob = blobMap.get(cell);
            showCell(cellBlob); 
        });
    }
}

function handleCellRightClick(blob) {
    blob.flagged ? game.numFlagged-- : game.numFlagged++;
    blob.flagged = !blob.flagged;
    blob.flagSprite.visible = blob.flagged;
}

function handleCellClick(event) {

    // Clicked Sprite:
    const sprite = event.target;

    // Retrieve our blob:
    const blob = blobMap.get(sprite);
    if (!blob) {
        console.error(`Could not resolve blob for sprite!`);
        return;
    }

    // Determine left or right click:
    const clickType = event.data.originalEvent.which;    
    if (clickType == 1) {
        handleCellLeftClick(blob); // Left Click
    } else if (clickType == 3) {
        handleCellRightClick(blob); // Right Click
    }

    // Check if game is won
    if (game.hasWon()) {
        showVictory();
    }
}
 /**
  * Performs setup for the game
  */
 function startGame() {
    
    // Start the game (via the game object)
    game.start();

    // Alias for pixi resources
    const resources = pixiResources;

    // Clear blob map
    blobMap.clear();

    const cellLayer = app.stage.getChildByName('cellLayer');

    // Create Cell Sprites:
    for (let y = 0; y < board_height; y++) {
        spriteMap[y] = {}; // todo remove
        for (let x = 0; x < board_width; x++) {

            const suffix = (x + y) % 2 === 0 ? 'light' : 'dark';
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

            // Create content cell:
            let contentCell;
            let text = game.board.grid[y][x];
            if (text !== '*') {
                
                const cellTextureName = 'cell_' + text + '_' + suffix;
                contentCell = new PIXI.Sprite(resources[cellTextureName].texture);
            } else {
                contentCell = new PIXI.Text(text);
            }

            contentCell.visible = false;
            contentCell.width = cell_length_px;
            contentCell.height = cell_length_px;                
            contentCell.anchor.x = 0;
            contentCell.anchor.y = 0;
            contentCell.x = x * cell_length_px;
            contentCell.y = y * cell_length_px;

            // Create Flag cell:
            //const flagCell = new PIXI.Text(text);
            const flagCell = new PIXI.Sprite(resources['flag' + '_' + suffix].texture);
            flagCell.visible = false;
            flagCell.width = cell_length_px;
            flagCell.height = cell_length_px;                
            flagCell.anchor.x = 0;
            flagCell.anchor.y = 0;
            flagCell.x = x * cell_length_px;
            flagCell.y = y * cell_length_px;
            
            // Save cell to blobMap
            blobMap.set(cell, new SpriteBlob(cell, contentCell, flagCell, y, x));

            // Handle clicks:
            cell.on('pointerdown', handleCellClick);

            // Add the cell to the scene we are building
            cellLayer.addChild(cell);
            cellLayer.addChild(contentCell);
            cellLayer.addChild(flagCell);
        }
    }
}

/**
 * Populate game victory screen:
 */
function populateGameOverWinContainer(resources, stage) {
    const gameOverWin = stage.getChildByName('gameOverWin');
    if (gameOverWin == null) {
        console.error(`Couldn't resolve game over win container!`);
        return;
    }

    // Game Over Win Container:
    gameOverWin.visible = false;
    gameOverWin.x = app_width / 2;
    gameOverWin.y = app_height / 2;

    const banner = new PIXI.Sprite(resources.victory_banner.texture);
    banner.anchor.x = 0.5;
    banner.anchor.y = 0.5;
    // todo scale so that it doesn't overflow!
    gameOverWin.addChild(banner);

    // Add Retry Button
    const retry = new PIXI.Sprite(resources.retry.texture);
    retry.anchor.x = 0.5;
    retry.anchor.y = 0.5;
    retry.x = -100;
    retry.y = 125;
    retry.interactive = true;
    retry.buttonMode = true;
    retry.on('pointerdown', () => {
        gameOverWin.visible = false; 
        startGame();
    });
    gameOverWin.addChild(retry);

    // Add Quit Button
    const quit = new PIXI.Sprite(resources.quit.texture);
    quit.anchor.x = 0.5;
    quit.anchor.y = 0.5;
    quit.x = 100;
    quit.y = 125;
    quit.interactive = true;
    quit.buttonMode = true;
    quit.on('pointerdown', () => {
        console.log(`show contact screen!`);
        // todo:
    });
    gameOverWin.addChild(quit);
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
        // todo:
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
cellLayer.name = 'cellLayer';
app.stage.addChild(cellLayer);

// Create Game Over Loss Container:
const gameOverLoss = new PIXI.Container();
gameOverLoss.name = 'gameOverLoss';
app.stage.addChild(gameOverLoss);

// Create Game Over Win Container:
const gameOverWin = new PIXI.Container();
gameOverWin.name = 'gameOverWin';
app.stage.addChild(gameOverWin);

app.loader.load((loader, resources) => {
    // Save resources for use later:
    pixiResources = resources;

    // Populate game over loss screen:
    populateGameOverLossContainer(resources, app.stage);

    // Populate game victory screen:
    populateGameOverWinContainer(resources, app.stage);

    // Start the game
    startGame();
});

