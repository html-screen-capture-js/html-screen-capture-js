let webpack = require('webpack');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
let path = require('path');
const env = require('yargs').argv.env; // use --env with webpack 2
let fileName = 'html-screen-capture';
let libraryName = 'htmlScreenCaptureJs';
let plugins = [], outputFile;
if (env === 'build') {
	plugins.push(new UglifyJsPlugin({ minimize: true }));
	outputFile = fileName + '.min.js';
} else {
	outputFile = fileName + '.js';
}

const config = {
	entry: __dirname + '/src/index.js',
	devtool: 'source-map',
	output: {
		path: __dirname + '/dist',
		filename: outputFile,
		library: libraryName,
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		rules: [
			{
				test: /(\.jsx|\.js)$/,
				loader: 'babel-loader',
				exclude: /(node_modules|bower_components)/
			}
		]
	},
	resolve: {
		modules: [path.resolve('./node_modules'), path.resolve('./src')],
		extensions: ['.json', '.js']
	},
	plugins: plugins
};

module.exports = config;
