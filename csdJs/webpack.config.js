const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './csd-bundle.js',
    output: {
        filename: 'csd-bundle.min.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: '$CSD',
            type: 'umd',
            export: 'default',
            umdNamedDefine: true
        },
        libraryTarget: 'umd',
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                    compress: {
                        drop_console: true,
                        drop_debugger: true,
                        pure_funcs: ['console.log']
                    }
                },
                extractComments: false,
            }),
        ],
    },
    resolve: {
        modules: [path.resolve(__dirname), 'node_modules'],
        alias: {
            '@components': path.resolve(__dirname, 'component')
        }
    }
};
