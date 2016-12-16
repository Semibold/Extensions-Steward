let gulp = require('gulp');
let zip = require('gulp-zip');

gulp.task('deploy', () => {
    return gulp
        .src('./source/**')
        .pipe(zip('extensions-steward.zip'))
        .pipe(gulp.dest('./deploy/'));
});
