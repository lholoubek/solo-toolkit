const gulp = require('gulp');
const electron = require('electron-connect').server.create();
const sass = require('gulp-sass');
const minify = require('gulp-minify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const cmd_exec = require('child_process').exec;
const babel = require('gulp-babel');
const fs = require('fs');

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
  gulp.watch(['./static/templates/*.hbs'], ['move-templates', electron.restart]);
});

// Task to clean the /dist foldre
gulp.task('clean', ()=>{
  let dist_path = "./dist";
  fs.rmdir(dist_path, (err)=>{
    if (err) console.log("Clean: /dist directory didn't exist or wrong path.");
    else {
      console.log("Clean task complete");
    }
  })
});

gulp.task('default',['sass-compile','js-compile', 'move-templates','watcher']);
