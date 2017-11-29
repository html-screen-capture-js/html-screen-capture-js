let webpack = require('webpack');
let path = require('path');
let PACKAGE = require('./package.json');
let banner = `/**\n* ${PACKAGE.description} v${PACKAGE.version}\n* Date: ${new Date()}\n**/`;

module.exports = {
	entry: {
		'html-screen-capture': './src/html-screen-capture.js'
	},
	output:{
		publicPath: '/',
		filename: 'dist/[name].js',
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
		new webpack.BannerPlugin({
			banner: banner,
			raw: true,
			entryOnly: true
		})
	]
};
