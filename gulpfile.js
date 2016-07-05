const gulp = require('gulp');
const electron = require('electron-connect').server.create();
const sass = require('gulp-sass');
const minify = require('gulp-minify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const cmd_exec = require('child_process').exec;
const babel = require('gulp-babel');

gulp.task('sass-compile', function () {
  gulp.src('./static/sass/styles.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./build/css'));
});

gulp.task('js-compile', () => {
      return gulp.src('./static/js/**/*.js')
      //.pipe(recursiveConcat({extname: "main.js", outside: true}))
      //.pipe(concat('compiled.js'))
      .pipe(babel({
  		 	presets: ['es2015']
  		 }))
      .pipe(gulp.dest('./build/js'));
});

gulp.task('move-templates', ()=>{
  return gulp.src('./static/templates/*')
  .pipe(gulp.dest('./build/templates'));
});

gulp.task('watcher', () => {
  electron.start();
  //Watch js files
  gulp.watch(['./static/js/**/*.js'], ['js-compile', electron.restart]);
  gulp.watch(['./main.js'],electron.restart);
  //watch css files
  gulp.watch(['./static/sass/*.scss'],['sass-compile', electron.reload]);
  //watch html
  gulp.watch(['./index.html'], electron.reload);
  //watch templates
  gulp.watch(['./static/templates/*.hbs'], electron.restart);
});

gulp.task('default',['sass-compile','js-compile', 'move-templates','watcher']);
