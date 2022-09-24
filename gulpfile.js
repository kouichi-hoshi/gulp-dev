const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass')) // Sassをコンパイルするプラグインを読み込みます
const ejs = require('gulp-ejs') //EJS
const rename = require('gulp-rename') //ファイル出力時にファイル名を変える
const autoprefixer = require('gulp-autoprefixer')
const plumber = require('gulp-plumber') //エラーによるタスクの強制停止を防止
const notify = require('gulp-notify') //デスクトップ通知
const browserSync = require('browser-sync').create() //変更を即座にブラウザへ反映
const fs = require('fs') //JSONファイル操作用
const del = require('del') //データ削除用

const debug = require('gulp-debug') // ログ表示
const path = require('path')
const named = require('vinyl-named')
const filter = require('gulp-filter') // ファイルフィルター
const webpack = require('webpack')
const webpackStream = require('webpack-stream')
const webpackConfig = require('./webpack.config.js')

/* path */
const srcBase = './src'
const distBase = './dist'

const srcPath = {
  scss: srcBase + '/scss/**/*.scss',
  img: srcBase + '/img/**/*',
  js: srcBase + '/js/**/*.js',
  json: srcBase + '/**/*.json',
  ejs: srcBase + '/**/*.ejs',
  _ejs: '!' + srcBase + '/_inc/**/*.ejs'
}
const distPath = {
  css: distBase + '/css',
  html: distBase + '/**/*.html',
  img: distBase + '/img',
  js: distBase + '/js',
  ejs: distBase + '/'
}

/* clean */
const clean = () => {
  return del([distBase + '/**'], { force: true })
}

/* sass */
const cssSass = () => {
  return gulp
    .src(srcPath.scss, {
      sourcemaps: false
    })
    .pipe(
      //エラーが出ても処理を止めない
      plumber({
        errorHandler: notify.onError('Error:<%= error.message %>')
      })
    )
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(autoprefixer()) //prefix
    .pipe(gulp.dest(distPath.css)) //コンパイル先
    .pipe(browserSync.stream())
    .pipe(
      notify({
        message: 'Sassをコンパイルしました',
        onLast: true
      })
    )
}

/* EJS */
const ejsFunc = () => {
  return gulp
    .src([srcPath.ejs, srcPath._ejs])
    .pipe(ejs({ ext: '.html' }))
    .pipe(rename({ extname: '.html' }))
    .pipe(gulp.dest(distPath.ejs))
}

/* image */
const imgFunc = () => {
  return gulp.src(srcPath.img).pipe(gulp.dest(distPath.img))
}

// /* js */
const jsFunc = () => {
  return gulp
    .src(srcPath.js)
    .pipe(
      plumber({
        errorHandler: notify.onError('Error: <%= error.message %>')
      })
    )
    .pipe(
      filter(function (file) {
        // _から始まるファイルを除外
        return !/\/_/.test(file.path) && !/^_/.test(file.relative)
      })
    )
    .pipe(
      named((file) => {
        const p = path.parse(file.relative)
        return (p.dir ? p.dir + path.sep : '') + p.name
      })
    )
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(gulp.dest(distPath.js))
    .pipe(debug({ title: 'js dest:' }))
}

/* ローカルサーバー立ち上げ */
const browserSyncFunc = () => {
  browserSync.init(browserSyncOption)
}

const browserSyncOption = {
  server: distBase
}

/* リロード */
const browserSyncReload = (done) => {
  browserSync.reload()
  done()
}

/* ファイルの変更時にbrowserSyncReloadする */
const watchFiles = () => {
  gulp.watch(srcPath.scss, gulp.series(cssSass))
  gulp.watch(srcPath.img, gulp.series(imgFunc, browserSyncReload))
  gulp.watch(srcPath.ejs, gulp.series(ejsFunc, browserSyncReload))
  gulp.watch(srcPath.js, gulp.series(jsFunc, browserSyncReload))
}

exports.default = gulp.series(
  clean,
  gulp.parallel(cssSass, ejsFunc, imgFunc, jsFunc),
  gulp.parallel(watchFiles, browserSyncFunc)
)

exports.build = gulp.series(clean, gulp.parallel(cssSass, ejsFunc, imgFunc, jsFunc))
