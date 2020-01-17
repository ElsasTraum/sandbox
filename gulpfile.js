"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var sourcemaps = require("gulp-sourcemaps");
var autoprefixer = require("gulp-autoprefixer");
var autoprefixerOptions = {};
var slim = require("gulp-slim");
var md = require("gulp-markdown");
var fileInclude = require('gulp-file-include');
var browserSync = require("browser-sync").create();
var newer = require("gulp-newer");
var gulpIgnore = require("gulp-ignore");
var filter = require('gulp-filter');

var paths = {
    html: {
        input: "src/slim/**/*.slim",
        output: "dist/",
        layout: "src/layout/"
    },
    styles: {
        input: "src/sass/**/*.scss",
        output: "dist/css/"
    },
    md: {
        input: "src/markdown/md/**/*.md",
        output: "src/markdown/md2html/"
    }
};

// SASS to CSS
sass.compiler = require('node-sass');

function style() {
    return (
        gulp
        .src(paths.styles.input, {
            since: gulp.lastRun(style),
            sourcemaps: true
        })
        .pipe(
            sass({
                outputStyle: "compressed"
            }).on("error", sass.logError)
        )
        .pipe(autoprefixer(autoprefixerOptions))
        .pipe(gulp.dest(paths.styles.output), { sourcemaps: './maps' })
        .pipe(browserSync.stream())
    );
}

// SLIM to HTML (for full page)
function htmlPage() {
    return gulp
        .src([paths.html.input, "!src/slim/0.include/**"])
        .pipe(
            newer({
                dest: paths.html.output,
                ext: ".html"
            })
        )
        .pipe(
            slim({
                pretty: true,
                options: "encoding='utf-8'",
                require: "slim/include", // 呼叫include plug-in
                format: "xhtml",
                options: 'include_dirs=["src/slim/0.include/"]'
            })
        )
        .pipe(gulp.dest(paths.html.output))
        .pipe(browserSync.stream());
}

// SLIM to HTML (for include)
/*function htmlInclude() {
    return gulp
        .src([paths.html.input, "!src/slim/0.include/**"])
        .pipe(
            slim({
                pretty: true,
                options: "encoding='utf-8'",
                require: "slim/include", // 呼叫include plug-in
                format: "xhtml",
                options: 'include_dirs=["src/slim/0.include/"]'
            })
        )
        .pipe(gulp.dest(paths.html.output))
        .pipe(browserSync.stream());
}*/

function htmlInclude() {
    const pageFilter = filter(
        [paths.html.input, "!src/slim/0.include/**"], { restore: true }
    );
    const layoutFilter = filter("src/slim/0.include/**", { restore: true });

    return gulp
        .src(['index.html'])
        .pipe(pageFilter)
        .pipe(
            slim({
                pretty: true,
                options: "encoding='utf-8'",
                require: "slim/include", // 呼叫include plug-in
                format: "xhtml",
                options: 'include_dirs=["src/slim/0.include/"]'
            })
        )
        .pipe(gulp.dest(paths.html.output))
        .pipe(browserSync.stream())
        .pipe(pageFilter.restore)
        .pipe(layoutFilter)
        .pipe(
            slim({
                pretty: true,
                options: "encoding='utf-8'",
                require: "slim/include", // 呼叫include plug-in
                format: "xhtml",
                options: 'include_dirs=["src/slim/0.include/"]'
            })
        )
        .pipe(gulp.dest(paths.html.layout));
    done();
}

// Markdown to HTML
function md() {
    return gulp.src('src/md/**/*.md')
        .pipe(md())
        .pipe(gulp.dest(paths.html.output));
}

// fileInclude 合併html
function fileInclude() {
    return gulp.src("src/markdown/md2html/*.html")
        .pipe(fileInclude())
        .pipe(gulp.dest(paths.html.output))
        .pipe(browserSync.stream());
    done();
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
    gulp.watch(paths.html.input, gulp.task('htmlPage'));
    gulp.watch(["src/slim/0.include/*.slim"], gulp.task('htmlInclude'));
    gulp.watch(paths.md.input, gulp.task('md'));
}

gulp.task('default', gulp.series(gulp.parallel(htmlPage, style, md), watchFiles));


// export tasks
exports.style = style;
exports.htmlPage = htmlPage;
exports.htmlInclude = htmlInclude;
exports.md = md;
exports.fileInclude = fileInclude;
exports.watchFiles = watchFiles;