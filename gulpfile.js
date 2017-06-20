/**
 * Gulp
 */
const gulp = require("gulp");
const gulpZip = require("gulp-zip");


gulp.task("deploy", () => {
    return gulp
        .src("./source/**")
        .pipe(gulpZip("extensions-steward.zip"))
        .pipe(gulp.dest("./deploy/"));
});
