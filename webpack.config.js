var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'docs');
var APP_DIR = path.resolve(__dirname, '.');

var plugins = [
];
var filename = '[name].js';
var devtool= 'inline-source-map';
if (process.env.NODE_ENV === "production") {
  plugins.push(new webpack.DefinePlugin({ 'process.env': { 'NODE_ENV': JSON.stringify('production') } }));
  BUILD_DIR = path.resolve(__dirname, 'docs/js');
  devtool= '';
}
module.exports = {
	entry: { main: APP_DIR + '/src/main.js' },
	output: {
		path: BUILD_DIR,
		filename: filename,
    publicPath: "/js/",
	},
	devtool: devtool,
	node: {fs: "empty"},
	plugins: plugins,
	resolve: {
		extensions: ['.js']
	},
	module: {
		loaders: [
		],
	},
};
