const gulp = require('gulp');
const electron = require('electron-connect').server.create();
const sass = require('gulp-sass');
const minify = require('gulp-minify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const cmd_exec = require('child_process').exec;
const babel = require('gulp-babel');
const fs = require('fs');
const rimraf = require('rimraf');

const env_file = "./app/.env.json";

// Set up the .env file for development
const dev_environment = {
    dev_env: true,
}
const prod_environment = {
  dev_env: false,
}

gulp.task('dev-env', ()=>{
  let out_env = JSON.stringify(dev_environment);
  fs.writeFile(env_file, out_env, ()=>{});
});

gulp.task('prod-env', ()=>{
  let out_env = JSON.stringify(prod_environment);
  fs.writeFile(env_file, out_env, ()=>{});
});

gulp.task('sass-compile', function () {
  gulp.src('./static/sass/styles.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./app/css'));
});

gulp.task('js-compile', () => {
      return gulp.src('./static/js/**/*.js')
      //.pipe(recursiveConcat({extname: "main.js", outside: true}))
      //.pipe(concat('compiled.js'))
      .pipe(babel({
  		 	presets: ['es2015']
  		 }))
      .pipe(gulp.dest('./app/js'));
});

gulp.task('move-templates', ()=>{
  return gulp.src('./static/templates/*')
  .pipe(gulp.dest('./app/templates'));
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
  let dist_path = __dirname + "/dist";
  console.log(dist_path);
  rimraf(dist_path, (err)=>{
    console.log(err);
    if (err) console.log("Clean: /dist directory didn't exist or wrong path.");
    else {
      console.log("Clean task complete");
    }
  })
});

gulp.task('default',['dev-env','sass-compile','js-compile', 'move-templates','watcher']);
