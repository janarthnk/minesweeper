const { src, dest } = require('gulp');

function defaultTask(cb) {
    // place code for your default task here
    src(['node_modules/pixi.js/**/*']).pipe(dest('scripts/pixi.js'));
    cb();
  }
  
  exports.default = defaultTask