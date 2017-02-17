var path = require('path');
var glob = require('glob');
var webpack = require('webpack');

var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
/*
extract-text-webpack-plugin插件，
可以将样式提取到单独的css文件里
 */
var ExtractTextPlugin = require('extract-text-webpack-plugin');
/*
html-webpack-plugin插件，webpack中生成HTML的插件
 */
var HtmlWebpackPlugin = require('html-webpack-plugin');

var config = {
	entry: {
		about: "./src/js/about.js",
		index: "./src/js/index.js",
		vendor: ["jquery","vue"]
	},
	output: {
		path: path.join(__dirname, 'dist'), //输出目录的配置，模板、样式、脚本、图片等资源的路径配置都相对于它
		publicPath:'',
		filename: 'js/[name].js'			//每个页面对应的主js的生成配置
	},
	resolve: {
		// 解决vue运行时问题
		alias: {
			'vue$': 'vue/dist/vue.common.js'
		}
	},
	module: {
		rules: [ //加载器，关于各个加载器的参数配置，可自行搜索之。
			{
				test: /\.json$/,
				//配置json，加载为url
				loader: 'file-loader',
				query:{
					name: 'json/[hash].[ext]',
					publicPath:'../',
					limit: 1
				}
			},
			{
				test: /\.css$/,
				//配置css的抽取器、加载器
				use:
					ExtractTextPlugin.extract({fallback:'style-loader', use:'css-loader?minimize'})
			},
			{
				test: /\.scss$/,
				//配置less的抽取器、加载器。中间!有必要解释一下，
				//根据从右到左的顺序依次调用less、css加载器，前一个的输出是后一个的输入
				use:
					ExtractTextPlugin.extract({use:'css-loader?minimize!sass-loader'})// publicPath可以设置url的相对路径
			},
			{
				//html模板加载器，可以处理引用的静态资源，默认配置参数attrs=img:src，处理图片的src引用的资源，如<img src=""/>
				//比如你配置，attrs=img:src img:data-src就可以一并处理data-src引用的资源了，就像下面这样
				test: /\.html$/,
				use: "html-loader?attrs=img:src img:data-src"
			},
			{
				// 			//图片加载器，雷同file-loader，更适合图片，可以将较小的图片转成base64，减少http请求
				// 			//如下配置，将小于8192byte的图片转成base64码
				test: /\.(jpe?g|png|gif|svg)$/,
				use: {
					loader: 'file-loader',
					options: {
						name: '../images/[hash].[ext]',
						limit: 2
					}
				}
			}
		]
	},
	plugins: [
		new webpack.ProvidePlugin({ //加载jq
			$: 'jquery'
		}),
		// new webpack.ProvidePlugin({ //加载vue
		// 	'Vue': 'vue'
		// }),

		new CommonsChunkPlugin({
			name: 'vendor', // 将公共模块提取，生成名为`vendors`的chunk
			minChunks: Infinity
		}),
		new webpack.optimize.UglifyJsPlugin({minimize: true}), //压缩js代码
		new ExtractTextPlugin('css/[name].css') //单独使用link标签加载css并设置路径，相对于output配置中的publickPath
	],
	//使用webpack-dev-server，提高开发效率
	devServer: {
		contentBase: path.join(__dirname, "dist"),
		inline: true,
		hot: false,
		port: 9090
	}
};

//遍历指定目录下所有html页面，用HtmlWebpackPlugin进行写html操作
var pages = Object.keys(getEntry('src/**/*.html', 'src/'));
pages.forEach(function(pathname) {
	var conf = {
		filename: pathname + '.html', //生成的html存放路径，相对于path
		template: 'src/' + pathname + '.html', //html模板路径
		inject: false, //js插入的位置，true/'head'/'body'/false
		inect: false	//不注入css和js
		// minify: { //压缩HTML文件，传入html-minifier
		// 	removeComments: true, //移除HTML中的注释
		// 	collapseWhitespace: true //删除空白符与换行符
		// }
	};
	// if (pathname in config.entry) {
	// 	// conf.favicon = path.resolve(__dirname, 'src/images/favicon.ico');
	// 	conf.inject = 'body';
	// 	conf.chunks = ['vendor', pathname];
	// 	conf.hash = true;
	// }
	config.plugins.push(new HtmlWebpackPlugin(conf));
});

module.exports = config;

function getEntry(globPath, pathDir) {
	var files = glob.sync(globPath);
	var entries = {},
		entry, dirname, basename, pathname, extname;

	for (var i = 0; i < files.length; i++) {
		entry = files[i];
		dirname = path.dirname(entry);
		extname = path.extname(entry);
		basename = path.basename(entry, extname);
		pathname = path.normalize(path.join(dirname,  basename));
		pathDir = path.normalize(pathDir);
		if(pathname.startsWith(pathDir)){
			pathname = pathname.substring(pathDir.length)
		}
		entries[pathname] = ['./' + entry];
	}
	return entries;
}
