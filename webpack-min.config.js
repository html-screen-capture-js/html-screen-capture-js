let webpack = require('webpack');
let path = require('path');
let PACKAGE = require('./package.json');
let banner = `/* ${PACKAGE.description} v${PACKAGE.version} */`;

module.exports = {
	entry: {
		'html-screen-capture': './src/html-screen-capture.js'
	},
	output:{
		publicPath: '/',
		filename: 'out/[name].min.js',
		libraryTarget: 'var',
		library: 'htmlScreenCapturer'
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				include: path.join(__dirname, 'src'),
				loader: 'babel-loader',
				query: {
					presets: ['es2015']
				}
			}
		]
	},
	plugins: [
		new webpack.LoaderOptionsPlugin({
			debug: true
		}),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false,
				drop_console: true
			}
		}),
		new webpack.BannerPlugin({
			banner: banner,
			raw: true,
			entryOnly: true
		})
	]
};
