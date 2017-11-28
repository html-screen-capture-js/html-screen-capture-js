let gulp = require('gulp');
let runSequence = require('run-sequence');
let webpack = require('webpack');
let webpackConfig = require('./webpack.config.js');
let webpackMinConfig = require('./webpack-min.config.js');

gulp.task('gulp-pack', function(cb) {
	webpack(
	webpackConfig,
	function(err, stats) {
		if (err) {
			console.log('ERROR - ',err);
		} else {
			console.log('Stats - ',stats);
		}
		cb();
	});
});

gulp.task('gulp-pack-min', function(cb) {
	webpack(
	webpackMinConfig,
	function(err, stats) {
		if (err) {
			console.log('ERROR - ',err);
		} else {
			console.log('Stats - ',stats);
		}
		cb();
	});
});

gulp.task('gulp-dist', function(cb) {
	gulp.src('out/html-screen-capture.js').pipe(gulp.dest('dist', {prefix: 1}));
	gulp.src('out/html-screen-capture.min.js').pipe(gulp.dest('dist', {prefix: 1}));
	cb();
});

gulp.task('default', function(cb) {
	runSequence(
		'gulp-pack',
		'gulp-pack-min',
		'gulp-dist',
		function() {
			cb();
		}
	);
});
