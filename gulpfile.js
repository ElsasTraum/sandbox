"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var sourcemaps = require("gulp-sourcemaps");
var autoprefixer = require("gulp-autoprefixer");
var autoprefixerOptions = {};
var slim = require("gulp-slim");
var md = require("gulp-markdown");
var browserSync = require("browser-sync").create();
var filter = require('gulp-filter');
var template = require('gulp-template-html');
var rename = require("gulp-rename");


var paths = {
    html: {
        input: "src/slim/**/*.slim", // Slim檔案資料夾
        output: "dist/", // 網頁根目錄
        temp: "src/template/" // 網頁共通模組，供markdown頁面組合用
    },
    styles: {
        input: "src/sass/**/*.scss",
        output: "dist/css/"
    },
    md: {
        input: "src/markdown/md/**/*.md", // Markdown
        output: "src/markdown/md2html/" // Markdown轉html暫存目錄
    }
};

// SASS to CSS
sass.compiler = require('node-sass');

function style() {
    return (
        gulp
        .src(paths.styles.input, {
            sourcemaps: true
        })
        .pipe(
            sass({
                outputStyle: "compressed"
            }).on("error", sass.logError)
        )
        .pipe(autoprefixer())
        .pipe(gulp.dest(paths.styles.output), { sourcemaps: './dist/css/maps' })
        .pipe(browserSync.stream())
    );
}

// SLIM to HTML (for full page)
function htmlPage() {
    return gulp
        .src([paths.html.input, "!src/slim/0.include/**", "!src/slim/1.template/**"], { since: gulp.lastRun(htmlPage) })
        .pipe(
            slim({
                pretty: true,
                options: "encoding='utf-8'",
                require: "slim/include", // 呼叫include plug-in
                format: "xhtml",
                options: 'include_dirs=["./src/slim/0.include/"]'
            })
        )
        .pipe(gulp.dest(paths.html.output))
        .pipe(browserSync.stream());
}

// SLIM to HTML (for Module)
function htmlInclude() {
    const pageFilter = filter(
        [paths.html.input, "!src/slim/0.include/**", "!src/slim/1.template/**"], { restore: true }
    );
    const tempFilter = filter("src/slim/1.template/**", { restore: true });

    return gulp
        .src(paths.html.input)
        .pipe(pageFilter)
        .pipe(
            slim({
                pretty: true,
                options: "encoding='utf-8'",
                require: "slim/include", // 呼叫include plug-in
                format: "xhtml",
                options: 'include_dirs=["./src/slim/0.include/"]'
            })
        )
        .pipe(gulp.dest(paths.html.output))
        .pipe(browserSync.stream())
        .pipe(pageFilter.restore)
        .pipe(tempFilter)
        .pipe(
            slim({
                pretty: true,
                options: "encoding='utf-8'",
                require: "slim/include", // 呼叫include plug-in
                format: "xhtml",
                options: 'include_dirs=["./src/slim/0.include/"]'
            })
        )
        .pipe(rename({
            dirname: ""
        }))
        .pipe(gulp.dest(paths.html.temp))
        .pipe(browserSync.stream())
    done();
}

// SLIM to HTML (for Tamplate)
function htmlTemp() {
    return gulp
        .src("./src/slim/1.template/**")
        .pipe(
            slim({
                pretty: true,
                options: "encoding='utf-8'",
                require: "slim/include", // 呼叫include plug-in
                format: "xhtml",
                options: 'include_dirs=["./src/slim/0.include/"]'
            }))
        .pipe(gulp.dest(paths.html.temp))
}

// Markdown to HTML
function md2html() {
    return gulp.src('src/markdown/md/**/*.md', { since: gulp.lastRun(md2html) })
        .pipe(md({
            headerIds: false,
            xhtml: true
        }))
        .pipe(gulp.dest(paths.md.output));
    done()
}

// htmlTempAll 當Template更新時刷新所有頁面
function htmlTempAll() {
    return gulp.src("src/markdown/md2html/*.html")
        .pipe(template('./src/template/novel-temp.html'))
        .pipe(gulp.dest(paths.html.output)) // Markdown to html最終輸出目錄
        .pipe(browserSync.stream());
    done()
}

// htmlTempPage 當markdown更新時刷新單一頁面
function htmlTempPage() {
    return gulp.src("src/markdown/md2html/*.html", { since: gulp.lastRun(md2html) })
        .pipe(template('./src/template/novel-temp.html'))
        .pipe(gulp.dest(paths.html.output)) // Markdown to html最終輸出目錄
        .pipe(browserSync.stream());
    done()
}

// BrowserSync Reload
const browserSyncOption = {
    server: {
        baseDir: './dist/',
        index: 'index.html',
    },
    reloadOnRestart: true,
};

function browserSyncReload() {
    browserSync.reload();
    done();
}

function browsersync(done) {
    browserSync.init(browserSyncOption);
    done();
}

function watchFiles(done) {
    browserSync.init({
        // You can tell browserSync to use this directory and serve it as a mini-server
        server: {
            baseDir: "./dist",
            index: 'index.html'
        }
    });
    gulp.watch(paths.styles.input, gulp.task('style'));
    gulp.watch([paths.html.input, "!src/slim/0.include/*.slim", "!src/slim/1.template/*.slim"], gulp.task('htmlPage'));
    gulp.watch("src/slim/0.include/*.slim", gulp.task('htmlInclude'));
    gulp.watch("src/slim/1.template/*.slim", gulp.task('htmlTemp'));
    gulp.watch(paths.html.temp, gulp.task('htmlTempAll'));
    gulp.watch(paths.md.input, gulp.task('md2html'));
    gulp.watch(paths.md.output, gulp.task('htmlTempPage'));
}

gulp.task('default', gulp.series(gulp.parallel(htmlPage, style, md2html), watchFiles));


// export tasks
exports.style = style;
exports.htmlPage = htmlPage;
exports.htmlInclude = htmlInclude;
exports.htmlTemp = htmlTemp;
exports.md2html = md2html;
exports.htmlTempAll = htmlTempAll;
exports.htmlTempPage = htmlTempPage;
exports.watchFiles = watchFiles;