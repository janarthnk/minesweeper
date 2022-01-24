/**
 * Author: Janarth Kumaresan
 */

import {Board, ClickResult, Game, GameFactory, SpriteBlob} from './minesweeper.js'
import { Timer } from './timer.js';

/**
 * Constants
 */
const debug_mode = true;

const sizes = {
    "small" : { w: 10, h: 8, numMines: 10 },
    "medium" : { w: 18, h: 14, numMines: 40 },
    "large"  : { w: 24, h: 20, numMines: 99 }
}

const default_size = 'small';

let board_width = sizes[default_size].w;
let board_height = sizes[default_size].h;
let num_mines = sizes[default_size].numMines;

const cell_length_px = 50;
const border_thickness_px = 5;

const flagCountTextFontSize = 24; 
const flagCountTextGapPx = 3; // Indicates the seperation in pixels between the bottom edge of the flag count icon and top edge of the flag count text.
const sideBarIconsVerticalGapPx = 10;

/**
 * Determine app dimensions
 */
let board_width_px = cell_length_px * board_width;
let board_height_px = cell_length_px * board_height;

const control_bar_num_cells = 2;
const control_bar_width_px = control_bar_num_cells * cell_length_px;
let control_bar_height_px = board_height_px;

let app_width = board_width_px + control_bar_width_px;
let app_height = board_height_px;

const blobMap = new Map();

/**
 * Game Globals:
 */

const timer = new Timer();

let pixiResources;

const textureNameToPath = {
    'unknown': './assets/unknown-cell.png',
    'light_blue':'./assets/amber/unknown_light.png',
    'dark_blue': './assets/amber/unknown_dark.png',
    'game_over_loss_banner': './assets/game-over-loss-banner.png',
    'border': './assets/amber/border.png',
    'corner_in_light' : './assets/amber/cornerInLight.png',
    'corner_in_dark' : './assets/amber/cornerInDark.png',
    'corner_out_light' : './assets/amber/cornerOutLight.png',
    'corner_out_dark' : './assets/amber/cornerOutDark.png',
    'retry': './assets/retry.png',
    'quit': './assets/quit.png',
    'flag': './assets/amber/flag.png',
    'flag_light': './assets/amber/flag_light.png',
    'flag_dark': './assets/amber/flag_dark.png',
    'flag_count_icon': './assets/amber/flag_count_icon.png',
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
    'green_dark': './assets/amber/green_dark.png',
    'green_light': './assets/amber/green_light.png',
    'clock': './assets/amber/clock.png',
    'size': './assets/amber/size_3.png'
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

/**
 * Does the work necessary to change the boards size.
 * @param {*} size - One of the following values 'small', 'medium', 'large'
 * @returns 
 */
function changeSize(size) {
    const newDimensions = sizes[size];
    if (newDimensions == null) {
        console.error("Unable to determine new board dimensions");
        return;
    }

    // Update Application Parameters:
    board_width = newDimensions.w;
    board_height = newDimensions.h;
    num_mines = newDimensions.numMines;

    board_width_px = cell_length_px * board_width;
    board_height_px = cell_length_px * board_height;

    control_bar_height_px = board_height_px;

    app_width = board_width_px + control_bar_width_px;
    app_height = board_height_px;

    // Create new board + update game
    const board = new Board(board_width, board_height, num_mines);
    game.board = board;

    // Update Application Dimensions
    app.renderer.resize(app_width, app_height);

    // Reposition game over loss container
    const gameOverLoss = app.stage.getChildByName('gameOverLoss');
    gameOverLoss.x = app_width / 2;
    gameOverLoss.y = app_height / 2;

    // Reposition game over win container
    const gameOverWin = app.stage.getChildByName('gameOverWin');
    gameOverWin.x = app_width / 2;
    gameOverWin.y = app_height / 2;

    // Reposition size dialog
    const sizeDialog = app.stage.getChildByName('sizeDialog');
    sizeDialog.x = app_width / 2;
    sizeDialog.y = app_height / 2;

    // Fix backdrop size!
    const backdrop = sizeDialog.getChildByName('backdrop');
    backdrop.height = app_height;
    backdrop.width = app_width;

    // Reposition control bar
    const controlBar = app.stage.getChildByName('controlBar');
    controlBar.x = board_width_px;

    // Change height of control bar:
    const controlBarBg = controlBar.getChildByName('background');
    controlBarBg.height = app_height;
        
    startGame();
}

function showVictory() {
    timer.stop();
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

// Return null if col/row is out of bounds
// Otherwise return blob at column and row.
function getBlobAt(col, row) {
    if (isOutOfBounds(col, row)) return null;
    const cell = spriteMap[row][col];
    return blobMap.get(cell);
}

function isOutOfBounds(col, row) {
    return row < 0 || row >= board_height || col < 0 || col >= board_width;
}

// Returns false if given `row`, `col` are out of bounds.
// Otherwise return if cell is clicked (since a clicked cell is shown).
function isShown(col, row) {
    // Out of bounds:
    if (isOutOfBounds(col, row)) return false;
    
    // Check if content is visible:
    const blob = getBlobAt(col, row);
    
    return blob.clicked;

}
function updateCellBorder(blob) {
    // Can't update border for unclicked cell
    if (!blob.clicked) return; 

    const x = blob.column;
    const y = blob.row;

    const content = blob.contentSprite;

    // Get Side Border Children:
    const top = content.getChildByName('top');
    const bottom = content.getChildByName('bottom');
    const right = content.getChildByName('right');
    const left = content.getChildByName('left');

    // Side Border Visibility:
    top.visible = !isShown(x, y-1);
    bottom.visible = !isShown(x, y+1);
    right.visible = !isShown(x+1, y);
    left.visible = !isShown(x-1, y);

    // Corner Border Visibility:
    content.getChildByName('topLeftIn').visible = top.visible && left.visible;
    content.getChildByName('topLeftOut').visible = !top.visible && !left.visible && !isShown(x-1, y-1);
    content.getChildByName('topLeftSolid').visible = (top.visible ^ left.visible);

    content.getChildByName('topRightIn').visible = top.visible && right.visible;
    content.getChildByName('topRightOut').visible = !top.visible && !right.visible && !isShown(x+1, y-1);
    content.getChildByName('topRightSolid').visible = (top.visible ^ right.visible);

    content.getChildByName('bottomRightIn').visible = bottom.visible && right.visible;
    content.getChildByName('bottomRightOut').visible = !bottom.visible && !right.visible && !isShown(x+1, y+1);
    content.getChildByName('bottomRightSolid').visible = (bottom.visible ^ right.visible);

    content.getChildByName('bottomLeftIn').visible = bottom.visible && left.visible;
    content.getChildByName('bottomLeftOut').visible = !bottom.visible && !left.visible && !isShown(x-1, y+1);
    content.getChildByName('bottomLeftSolid').visible = (bottom.visible ^ left.visible);
}

// Given a blob returns all neighbor blobs!
function neighbors(blob) {
    const y = blob.row;
    const x = blob.column;
    const neighborCoords = [[x-1, y], [x-1, y-1], [x-1, y+1], [x, y-1], [x, y+1], [x+1, y], [x+1, y-1], [x+1, y+1]];
    const validCoords = neighborCoords.filter(coords => !isOutOfBounds(coords[0], coords[1]));
    return validCoords.map(coords => getBlobAt(coords[0], coords[1]));
}

function handleCellLeftClick(blob) {
    
    if (blob.clicked) return; // Already clicked peace out:
    if (blob.flagged) return; // If it's flagged it cannot be clicked

    showCell(blob);

    // List of blobs whose border needs to be updated.
    const borderUpdateSet = new Set();
    borderUpdateSet.add(blob);

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
            timer.stop();
            const gameOverLossContainer = app.stage.getChildByName('gameOverLoss');
            gameOverLossContainer.visible = true;
        });
    } else if ( res === ClickResult.ZERO ) {
        // Show all cells on the island:
        const coordToClick = data;
        coordToClick.forEach(coordSet => {
            const row = coordSet[0];
            const col = coordSet[1];
            const cellBlob = getBlobAt(col, row);
            showCell(cellBlob); 
            borderUpdateSet.add(cellBlob);
        });
    }

    // Add neighbors to update list:
    for (const blob of borderUpdateSet) {
        neighbors(blob).forEach(n => borderUpdateSet.add(n));
    }
    
    // Update Borders:
    for (const blob of borderUpdateSet) updateCellBorder(blob);
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

    // Reset our timer
    timer.reset();
    timer.start();

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

            // Content container has everything necessary to display the cell (eg: number, background, borders): 
            const content = new PIXI.Container();
            content.visible = false;
            content.x = x * cell_length_px;
            content.y = y * cell_length_px;

            // Create content cell:
            let contentCell;
            let text = game.board.grid[y][x];
            if (text !== '*') {
                const cellTextureName = 'cell_' + text + '_' + suffix;
                contentCell = new PIXI.Sprite(resources[cellTextureName].texture);
            } else {
                contentCell = new PIXI.Text(text);
            }
            contentCell.width = cell_length_px;
            contentCell.height = cell_length_px;                
            content.addChild(contentCell);
            
            // Top Border:
            const topBorder = new PIXI.Sprite(resources['border'].texture);
            topBorder.width = cell_length_px - (2 * border_thickness_px);
            topBorder.height = border_thickness_px;
            topBorder.x = border_thickness_px;
            topBorder.y = 0;
            topBorder.name = 'top';
            topBorder.visible = false;
            content.addChild(topBorder);

            // Bottom Border:
            const bottomBorder = new PIXI.Sprite(resources['border'].texture);
            bottomBorder.width = cell_length_px - (2 * border_thickness_px);
            bottomBorder.height = border_thickness_px;
            bottomBorder.x = border_thickness_px;
            bottomBorder.y = cell_length_px - border_thickness_px;
            bottomBorder.name = 'bottom';
            bottomBorder.visible = false;
            content.addChild(bottomBorder);

            // Right Border:
            const rightBorder = new PIXI.Sprite(resources['border'].texture);
            rightBorder.width = border_thickness_px;
            rightBorder.height = cell_length_px - (2 * border_thickness_px);
            rightBorder.x = cell_length_px - border_thickness_px;
            rightBorder.y = border_thickness_px;
            rightBorder.name = 'right';
            rightBorder.visible = false;
            content.addChild(rightBorder);

            // Left Border:
            const leftBorder = new PIXI.Sprite(resources['border'].texture);
            leftBorder.width = border_thickness_px;
            leftBorder.height = cell_length_px - (2 * border_thickness_px);
            leftBorder.x = 0;
            leftBorder.y = border_thickness_px;
            leftBorder.name = 'left';
            leftBorder.visible = false;
            content.addChild(leftBorder);

            // Top Left Corner (In / Out / Solid)
            const topLeftInCorner = new PIXI.Sprite(resources['corner_in_' + suffix].texture);
            topLeftInCorner.width = border_thickness_px;
            topLeftInCorner.height = border_thickness_px;
            topLeftInCorner.name = 'topLeftIn';
            topLeftInCorner.visible = false;
            content.addChild(topLeftInCorner);

            const topLeftOutCorner = new PIXI.Sprite(resources['corner_out_' + suffix].texture);
            topLeftOutCorner.width = border_thickness_px;
            topLeftOutCorner.height = border_thickness_px;
            topLeftOutCorner.x = border_thickness_px;
            topLeftOutCorner.y = border_thickness_px;
            topLeftOutCorner.name = 'topLeftOut';
            topLeftOutCorner.angle = 180;
            topLeftOutCorner.visible = false;
            content.addChild(topLeftOutCorner);

            const topLeftSolidCorner = new PIXI.Sprite(resources['border'].texture);
            topLeftSolidCorner.width = border_thickness_px;
            topLeftSolidCorner.height = border_thickness_px;
            topLeftSolidCorner.name = 'topLeftSolid';
            topLeftSolidCorner.visible = false;
            content.addChild(topLeftSolidCorner);

            // Top Right Corner (In / Out / Solid)
            const topRightInCorner = new PIXI.Sprite(resources['corner_in_' + suffix].texture);
            topRightInCorner.width = border_thickness_px;
            topRightInCorner.height = border_thickness_px;
            topRightInCorner.angle = 90;
            topRightInCorner.x = cell_length_px;
            topRightInCorner.name = 'topRightIn';
            topRightInCorner.visible = false;
            content.addChild(topRightInCorner);

            const topRightOutCorner = new PIXI.Sprite(resources['corner_out_' + suffix].texture);
            topRightOutCorner.width = border_thickness_px;
            topRightOutCorner.height = border_thickness_px;
            topRightOutCorner.angle = -90;
            topRightOutCorner.x = cell_length_px - border_thickness_px;
            topRightOutCorner.y = border_thickness_px;
            topRightOutCorner.name = 'topRightOut';
            topRightOutCorner.visible = false;
            content.addChild(topRightOutCorner);

            const topRightSolidCorner = new PIXI.Sprite(resources['border'].texture);
            topRightSolidCorner.width = border_thickness_px;
            topRightSolidCorner.height = border_thickness_px;
            topRightSolidCorner.x = cell_length_px - border_thickness_px;
            topRightSolidCorner.name = 'topRightSolid';
            topRightSolidCorner.visible = false;
            content.addChild(topRightSolidCorner);

            // Bottom Right Corner (In / Out / Solid)
            const bottomRightInCorner = new PIXI.Sprite(resources['corner_in_' + suffix].texture);
            bottomRightInCorner.width = border_thickness_px;
            bottomRightInCorner.height = border_thickness_px;
            bottomRightInCorner.angle = 180;
            bottomRightInCorner.x = cell_length_px;
            bottomRightInCorner.y = cell_length_px;
            bottomRightInCorner.name = 'bottomRightIn';
            bottomRightInCorner.visible = false;
            content.addChild(bottomRightInCorner);

            const bottomRightOutCorner = new PIXI.Sprite(resources['corner_out_' + suffix].texture);
            bottomRightOutCorner.width = border_thickness_px;
            bottomRightOutCorner.height = border_thickness_px;
            bottomRightOutCorner.x = cell_length_px - border_thickness_px;
            bottomRightOutCorner.y = cell_length_px - border_thickness_px;
            bottomRightOutCorner.name = 'bottomRightOut';
            bottomRightOutCorner.visible = false;
            content.addChild(bottomRightOutCorner);

            const bottomRightSolidCorner = new PIXI.Sprite(resources['border'].texture);
            bottomRightSolidCorner.width = border_thickness_px;
            bottomRightSolidCorner.height = border_thickness_px;
            bottomRightSolidCorner.x = cell_length_px - border_thickness_px;
            bottomRightSolidCorner.y = cell_length_px - border_thickness_px;
            bottomRightSolidCorner.name = 'bottomRightSolid';
            bottomRightSolidCorner.visible = false;
            content.addChild(bottomRightSolidCorner);

            // Bottom Left Corner (In / Out / Solid)
            const bottomLeftInCorner = new PIXI.Sprite(resources['corner_in_' + suffix].texture);
            bottomLeftInCorner.width = border_thickness_px;
            bottomLeftInCorner.height = border_thickness_px;
            bottomLeftInCorner.angle = -90;
            bottomLeftInCorner.y = cell_length_px;
            bottomLeftInCorner.name = 'bottomLeftIn';
            bottomLeftInCorner.visible = false;
            content.addChild(bottomLeftInCorner);

            const bottomLeftOutCorner = new PIXI.Sprite(resources['corner_out_' + suffix].texture);
            bottomLeftOutCorner.width = border_thickness_px;
            bottomLeftOutCorner.height = border_thickness_px;
            bottomLeftOutCorner.angle = 90;
            bottomLeftOutCorner.x = border_thickness_px;
            bottomLeftOutCorner.y = cell_length_px - border_thickness_px;
            bottomLeftOutCorner.name = 'bottomLeftOut';
            bottomLeftOutCorner.visible = false;
            content.addChild(bottomLeftOutCorner);

            const bottomLeftSolidCorner = new PIXI.Sprite(resources['border'].texture);
            bottomLeftSolidCorner.width = border_thickness_px;
            bottomLeftSolidCorner.height = border_thickness_px;
            bottomLeftSolidCorner.y = cell_length_px - border_thickness_px;
            bottomLeftSolidCorner.name = 'bottomLeftSolid';
            bottomLeftSolidCorner.visible = false;
            content.addChild(bottomLeftSolidCorner);

            // Create Flag cell:
            const flagCell = new PIXI.Sprite(resources['flag' + '_' + suffix].texture);
            flagCell.visible = false;
            flagCell.width = cell_length_px;
            flagCell.height = cell_length_px;                
            flagCell.anchor.x = 0;
            flagCell.anchor.y = 0;
            flagCell.x = x * cell_length_px;
            flagCell.y = y * cell_length_px;
            
            // Save cell to blobMap
            blobMap.set(cell, new SpriteBlob(cell, content, flagCell, y, x));

            // Handle clicks:
            cell.on('pointerdown', handleCellClick);

            // Add the cell to the scene we are building
            cellLayer.addChild(cell);
            cellLayer.addChild(content);
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
    gameOverWin.x = 300;
    gameOverWin.y = 200;

    const banner = new PIXI.Sprite(resources.victory_banner.texture);
    banner.anchor.x = 0.5;
    banner.anchor.y = 0.5;
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
    gameOverLoss.x = 300;
    gameOverLoss.y = 200;

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
 * 
 * @param {*} resources 
 * @param {*} stage
 */
function populateControlBar(resources, stage) {
    const controlBar = app.stage.getChildByName('controlBar');
    if (controlBar == null) {
        console.error("Couldn't resolve 'controlBar'!");
        return;
    }

    // Position it horizontally on the side
    controlBar.x = cell_length_px * board_width;

    // Create background:
    const background = new PIXI.Sprite(resources['green_dark'].texture);
    background.name = "background";
    background.height = cell_length_px * board_height;
    background.width = cell_length_px * 2;

    // //Pattern:
    // const background = new PIXI.Container();
    // for (let i = 0; i < control_bar_num_cells; i++) {
    //     for (let j = 0; j < board_height; j++) {
    //         const suffix = ((i + j) % 2) == 0 ? '_light' : '_dark';
    //         const texture = 'green' + suffix;
    //         const cell = new PIXI.Sprite(resources[texture].texture);
    //         cell.x = i * cell_length_px;
    //         cell.y = j * cell_length_px;
    //         cell.width = cell_length_px;
    //         cell.height = cell_length_px;
    //         background.addChild(cell);
    //     }
    // }
    
    controlBar.addChild(background);
}

function createAndPositionControlBarContent(resources, stage) {
    // Create Clock
    const clockContainer = new PIXI.Container();
    clockContainer.name = "clock";

    // Create Clock Symbol:
    const clockSymbol = new PIXI.Sprite(resources['clock'].texture);
    clockSymbol.width = cell_length_px;
    clockSymbol.height = cell_length_px;
    clockSymbol.anchor.x = 0.5;
    clockContainer.addChild(clockSymbol);

    // Create Time Text:
    const timeText = new PIXI.Text("00:00", {fontSize: 24});
    timeText.name = "text";
    timeText.anchor.x = 0.5;
    timeText.y = cell_length_px;
    clockContainer.addChild(timeText);

    // Subscribe to our timer so we can update every second    
    timer.subscribe("clock-text", (seconds) => {
        // Format time into "MM:SS":
        const ss = (seconds % 60).toString(10).padStart(2, '0');
        const mm = ((Math.floor(seconds / 60)) % 60).toString(10).padStart(2, '0');
        const hh = Math.floor(seconds / 3600) % 12; //unused but perhaps i shall use it :D ...
        timeText.text = `${mm}:${ss}`;
    });

    // Create Flag Container:
    const flagContainer = new PIXI.Container();
    flagContainer.name = "flag";

    // Create Flag Symbol:
    const flagSymbol = new PIXI.Sprite(resources['flag_count_icon'].texture);
    flagSymbol.width = cell_length_px;
    flagSymbol.height = cell_length_px;
    flagSymbol.anchor.x = 0.5;
    flagContainer.addChild(flagSymbol);

    // Create flag Text:
    const flagText = new PIXI.Text(num_mines.toString(), {fontSize: flagCountTextFontSize});
    flagText.name = "text";
    flagText.anchor.x = 0.5;
    flagText.y = flagSymbol.height + flagCountTextGapPx; // assumes anchor.y = 0
    flagText.x = 2; // a little shift so we line up with our flag pole.
    flagContainer.addChild(flagText);

    // Create Difficulty Icon:
    // todo: create texture for size dialog
    const sizeIcon = new PIXI.Sprite(resources['size'].texture);    
    sizeIcon.width = cell_length_px;
    sizeIcon.height = cell_length_px;
    sizeIcon.anchor.x = 0.5;
    sizeIcon.interactive = true;
    sizeIcon.buttonMode = true;
    sizeIcon.on('pointerdown', () => {
        const sizeDialog = app.stage.getChildByName("sizeDialog");
        sizeDialog.visible = !sizeDialog.visible;
    });

    // Update text when the number of flagged cells changes
    game.numFlagged$.subscribe((n) => {
        flagText.text = (num_mines - n).toString();
    });

    // Create content container and add it to the controlBar:
    const controlBar = app.stage.getChildByName("controlBar");
    const content = new PIXI.Container();
    controlBar.addChild(content);

    // Add the icons to content container:
    const sidebarIcons = [clockContainer, flagContainer, sizeIcon];
    let nextYPosition = 0;
    sidebarIcons.forEach(c => {
        content.addChild(c);
        c.y = nextYPosition;
        nextYPosition += c.height + sideBarIconsVerticalGapPx;
    });

    // Position Content container so it's centered vertically on the control bar
    const contentHeight = sidebarIcons.map(c => c.height).reduce((totalHeight, childHeight) => totalHeight + childHeight); // height of all content
    const totalContentHeight = contentHeight + (sideBarIconsVerticalGapPx * (sidebarIcons.length - 1)); // height of all content + gaps between them.
    content.x = control_bar_width_px / 2;
    // content.y = (control_bar_height_px - totalContentHeight) / 2; // center content horizontally...
    content.y = 50; // Fixed spacing offset from top

    // Future enhancement, handle sidebar content overflow!
    if (totalContentHeight > control_bar_height_px) console.warn("Side bar content height exceeds control bar height!");
}

function populateSizeDialog(resources, stage) {
    const sizeDialog = stage.getChildByName('sizeDialog');
    if (sizeDialog == null) {
        console.error(`Could not resolve size dialog`);
        return;
    }

    //Center difficulty dialog:
    sizeDialog.x = app_width / 2;
    sizeDialog.y = app_height / 2;
    
    // Create backdrop for dialog.
    const backdrop = new PIXI.Graphics();
    backdrop.name = 'backdrop';
    backdrop.beginFill(0x000000, 0.3);
    backdrop.drawRect(-app_width / 2, -app_height / 2, app_width, app_height); // screen size since we want to prevent them from playing the game... 
    backdrop.endFill();
    backdrop.interactive = true;
    backdrop.buttonMode = true;
    backdrop.on('pointerdown', () => {
        sizeDialog.visible = false;
    });
    sizeDialog.addChild(backdrop);

    // Create bounding box for size icons
    const widgetWidth = 400;
    const widgetHeight = 200;
    const widgetRadius = 25;
    const widget = new PIXI.Graphics();
    widget.lineStyle(10,0x755800);
    widget.beginFill(0xFFBF00);
    // widget.drawRect(- widgetWidth / 2, -widgetHeight / 2, widgetWidth, widgetHeight);
    widget.drawRoundedRect( -widgetWidth / 2, -widgetHeight / 2, widgetWidth, widgetHeight, widgetRadius);
    widget.endFill();
    // widget.anchor.x = 0.5;
    // widget.anchor.y = 0.5;
    sizeDialog.addChild(widget);

    // Create Size Buttons:    
    const sizeIconWidth = 75;
    const sizeIconHeight = 75;
    const sizeIconXSeperation = sizeIconWidth + 50;

    // Create Small Icon:
    const smallIcon = new PIXI.Graphics();
    smallIcon.beginFill(0x00FF00); // todo: Adjust fill and alpha
    smallIcon.drawRect(-sizeIconWidth / 2, -sizeIconHeight / 2, sizeIconWidth, sizeIconHeight);
    smallIcon.endFill();
    smallIcon.interactive = true;
    smallIcon.buttonMode = true;
    smallIcon.on('pointerdown', () => {
        changeSize('small');
        sizeDialog.visible = false;

    });
    smallIcon.x = -sizeIconXSeperation;
    widget.addChild(smallIcon);

    // Create Medium Icon:
    const mediumIcon = new PIXI.Graphics();
    mediumIcon.beginFill(0x0000FF); // todo: Adjust fill and alpha
    mediumIcon.drawRect(-sizeIconWidth / 2, -sizeIconHeight / 2, sizeIconWidth, sizeIconHeight);
    mediumIcon.endFill();
    mediumIcon.interactive = true;
    mediumIcon.buttonMode = true;
    mediumIcon.on('pointerdown', () => {
        changeSize('medium');
        sizeDialog.visible = false;
    });
    widget.addChild(mediumIcon);

    // Create Large Icon
    const largeIcon = new PIXI.Graphics();
    largeIcon.beginFill(0xFF0000); // todo: Adjust fill and alpha
    largeIcon.drawRect(-sizeIconWidth / 2, -sizeIconHeight / 2, sizeIconWidth, sizeIconHeight);
    largeIcon.endFill();
    largeIcon.interactive = true;
    largeIcon.buttonMode = true;
    largeIcon.on('pointerdown', () => {
        changeSize('large');
        sizeDialog.visible = false;
    });
    largeIcon.x = sizeIconXSeperation;
    widget.addChild(largeIcon);
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

// Create Control Bar
const controlBar = new PIXI.Container();
controlBar.name = 'controlBar';
app.stage.addChild(controlBar);

// Create Size Dialog:
const sizeDialog = new PIXI.Container();
sizeDialog.name = "sizeDialog";
app.stage.addChild(sizeDialog);

app.loader.load((loader, resources) => {
    // Save resources for use later:
    pixiResources = resources;

    // Populate game over loss screen:
    populateGameOverLossContainer(resources, app.stage);

    // Populate game victory screen:
    populateGameOverWinContainer(resources, app.stage);

    // Populate control bar
    populateControlBar(resources, app.stage);
    
    // Create and Position Control Bar Content:
    createAndPositionControlBarContent(resources, app.stage);

    // Create Size Dialog:
    populateSizeDialog(resources, app.stage);

    // Start the game
    startGame();
});
