import path from 'path'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import express from 'express'
import ErrorOverlayPlugin from 'error-overlay-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import packageJson from './package.json'

module.exports = (env, argv) => {
  const config: webpack.Configuration = {
    entry: ['./src/mobile/index.tsx'],

    output: {
      filename: '[name].[hash].js',
      path: path.resolve(__dirname, 'compiled-mobile'),
    },

    devtool: 'inline-source-map',

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
          loader: 'url-loader',
          options: {
            limit: 8192,
          },
        },
        {
          test: /\.tsx?$/,
          use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
          exclude: /node_modules/,
        },
        {
          test: /\.md$/,
          use: [
            {
              loader: 'raw-loader',
            },
          ],
        },
      ],
    },

    plugins: [
      new webpack.NamedModulesPlugin(),
      // prints more readable module names in the browser console on HMR updates

      new webpack.NoEmitOnErrorsPlugin(),
      // do not emit compiled assets that include errors
      new HtmlWebpackPlugin({
        template: 'mobile.html',
      }),
      new ErrorOverlayPlugin(),
      new webpack.DefinePlugin({
        'process.env.VERSION': JSON.stringify(packageJson.version),
      }),
      new webpack.EnvironmentPlugin([
        'NODE_ENV',
        'AMPLIFY_AUTH_IDENTITY_POOL_ID',
        'AMPLIFY_AUTH_REGION',
        'AMPLIFY_PINPOINT_APPID',
        'AMPLIFY_PINPOINT_REGION',
        'BOOST_NOTE_BASE_URL',
        'BOOST_HUB_BASE_URL',
        'SSE_URL',
        'REALTIME_URL',
        'GA_TRACKING_ID',
        'GITHUB_OAUTH_ID',
        'GOOGLE_CLIENT_ID',
        'INTERCOM_APP_ID',
        'STRIPE_PUBLISHABLE_KEY',
        'COUPONS_NEW_USER_STANDARD',
        'COUPONS_NEW_USER_PRO',
      ]),
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, 'node_modules/codemirror/theme'),
            to: 'app/codemirror/theme',
          },
          // {
          //   from: path.join(__dirname, 'mobile-static'),
          //   to: 'app/static',
          // },
          {
            from: path.join(__dirname, 'node_modules/katex/dist/katex.min.css'),
            to: 'app/katex/katex.min.css',
          },
          {
            from: path.join(
              __dirname,
              'node_modules/remark-admonitions/styles/classic.css'
            ),
            to: 'app/remark-admonitions/classic.css',
          },
        ],
      }),
    ],

    devServer: {
      host: 'localhost',
      port: 3005,

      disableHostCheck: true,

      historyApiFallback: {
        index: '/',
      },
      // respond to 404s with index.html

      hot: true,
      // enable HMR on the server

      before: function (app, server) {
        app.use((req, res, next) => {
          res.setHeader(
            'Access-Control-Allow-Origin',
            process.env.MOBILE_BOOST_HUB_BASE_URL
          )
          res.setHeader(
            'Access-Control-Allow-Methods',
            'OPTIONS, GET, POST, PUT, PATCH, DELETE'
          )
          res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, Set-Cookie'
          )
          res.setHeader('Access-Control-Allow-Credentials', 'true')
          next()
        })

        app.use(
          '/app/codemirror/mode',
          express.static(path.join(__dirname, 'node_modules/codemirror/mode'))
        )
        app.use(
          '/app/codemirror/addon',
          express.static(path.join(__dirname, 'node_modules/codemirror/addon'))
        )
        app.use(
          '/app/codemirror/theme',
          express.static(path.join(__dirname, 'node_modules/codemirror/theme'))
        )
        app.use(
          '/app/katex/katex.min.css',
          express.static(
            path.join(__dirname, 'node_modules/katex/dist/katex.min.css')
          )
        )
        app.use(
          '/app/remark-admonitions/classic.css',
          express.static(
            path.join(
              __dirname,
              'node_modules/remark-admonitions/styles/classic.css'
            )
          )
        )
        // app.use(
        //   '/static',
        //   express.static(path.join(__dirname, 'mobile-static'))
        // )
      },
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    node: {
      fs: 'empty',
    },
  }

  if (argv.mode === 'development') {
    config.plugins.unshift(new webpack.HotModuleReplacementPlugin())

    config.entry = [
      'react-hot-loader/patch',
      'webpack-dev-server/client?http://localhost:3005',
      'webpack/hot/only-dev-server',
      ...(config.entry as string[]),
    ]
    config.output.publicPath = '/'
  }

  if (argv.mode === 'production') {
    config.optimization = {
      minimize: true,
    }
    config.output.publicPath = '/'
  }

  return config
}
