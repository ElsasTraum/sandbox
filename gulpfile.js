"use strict";

var gulp = require("gulp");
var sass = require("node-sass");
var sourcemaps = require("gulp-sourcemaps");
var autoprefixer = require("gulp-autoprefixer");
var autoprefixerOptions = {
    browsers: ["last 2 versions", "> 5%", "Firefox ESR"]
};
var slim = require("gulp-slim");
var md = require("gulp-markdown");
var fileinclude = require('gulp-file-include');
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
    sass: {
        input: "src/sass/**/*.scss",
        output: "dist/css/"
    },
    md: {
        input: "src/markdown/md/**/*.md",
        output: "src/markdown/md2html/"
    }
};

// SASS to CSS
function style() {
    return (
        gulp
        .src(paths.sass.input)
        .pipe(sourcemaps.init())
        .pipe(
            sass({
                outputStyle: "compressed"
            }).on("error", sass.logError)
        )
        .pipe(autoprefixer(autoprefixerOptions))
        .pipe(sourcemaps.write(""))
        .pipe(gulp.dest(paths.sass.output))
        // Add browsersync stream pipe after compilation
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
}

// Markdown to HTML
function md() {
    return gulp.src('src/md/**/*.md')
        .pipe(md())
        .pipe(gulp.dest(paths.html.output));
}

// fileinclude 合併html
function fileinclude() {
    return gulp.src(paths.md.output)
        .pipe(fileinclude({
            prefix: '@@',
        }))
        .pipe(gulp.dest(paths.html.output))
        .pipe(browserSync.stream());
}

// BrowserSync Reload
function browserSyncReload() {
    browserSync.reload();
}

// Add browsersync initialization at the start of the watch task
function watch() {
    browserSync.init({
        // You can tell browserSync to use this directory and serve it as a mini-server
        server: {
            baseDir: "./dist"
            // index: "2.shop--index.html"
        }
    });
    gulp.watch(paths.sass.input, style);
    gulp.watch(paths.html.input, htmlPage);
    gulp.watch(["src/slim/0.include/*.slim"], htmlInclude);
    gulp.watch(paths.md.input, md);
    gulp.watch(paths.md.output, fileinclude);
    gulp.watch(
        ["./dist/js/**/*", "./dist/images/**/*", "./dist/fonts/**/*"],
        browserSyncReload
    );
}

// export tasks
exports.style = style;
exports.htmlPage = htmlPage;
exports.htmlInclude = htmlInclude;
exports.md = md;
exports.fileinclude = fileinclude;
exports.watch = watch;
exports.default = watch;