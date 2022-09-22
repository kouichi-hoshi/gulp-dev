const gulp = require('gulp')
const { src, dest, watch } = require('gulp') // gulpプラグインを読み込みます
const sass = require('gulp-sass')(require('sass')) // Sassをコンパイルするプラグインを読み込みます
const ejs = require('gulp-ejs') //EJS
const rename = require('gulp-rename') //ファイル出力時にファイル名を変える
const autoprefixer = require('gulp-autoprefixer')
const plumber = require('gulp-plumber') //エラーによるタスクの強制停止を防止
const notify = require('gulp-notify') //デスクトップ通知
const browserSync = require('browser-sync').create() //変更を即座にブラウザへ反映
const fs = require('fs') //JSONファイル操作用
const del = require('del') //データ削除用

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
  item: distBase + '/item'
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
        message: 'Sassをコンパイルしました！',
        onLast: true
      })
    )
}

/* EJS */
const ejsFunc = () => {
  var jsonFile = srcBase + '/data/pages.json',
    json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))

  return gulp
    .src([srcPath.ejs, srcPath._ejs])
    .pipe(ejs({ json: json }))
    .pipe(
      rename({
        basename: 'index', //ファイル名
        extname: '.html' //拡張子
      })
    )
    .pipe(gulp.dest(distPath.item))
}

/* image */
const imgFunc = () => {
  return gulp.src(srcPath.img).pipe(gulp.dest(distPath.img))
}

/* js */
const jsFunc = () => {
  return gulp.src(srcPath.js).pipe(gulp.dest(distPath.js))
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
