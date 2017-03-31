/**
 * Deploy
 */
const gulp = require("gulp");
const gulpZip = require("gulp-zip");


gulp.task("deploy", n => {
    return gulp
        .src("./source/**")
        .pipe(gulpZip("extensions-steward.zip"))
        .pipe(gulp.dest("./deploy/"));
});
