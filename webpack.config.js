// webpack.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

module.exports = {
  entry: path.resolve(__dirname, "./src/index.ts"),     // ← TS entry
  mode: "development",
  devtool: "eval-source-map",
  output: {
    publicPath: "auto",
    clean: true,
    path: path.resolve(__dirname, "dist"),
    uniqueName: "bookingApp",
  },
  devServer: {
    port: 3002,
    static: { directory: path.resolve(__dirname, "public"), watch: true },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
    },
    hot: true,
    liveReload: true,
    watchFiles: { paths: ["src/**/*", "public/**/*"], options: { usePolling: true, interval: 300, ignored: /node_modules/ } },
    client: { overlay: true, progress: true },
    open: false,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],          // ← keep TS extensions
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,                                  // ← compile TS/TSX
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,                                  // ← (optional) for any JS files you still have
        exclude: /node_modules/,
        use: { loader: "babel-loader" },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "bookingApp",
      filename: "remoteEntry.js",
      exposes: {
        "./useSession": "./src/booking/useSession",
        "./bookingsSlice": "./src/store/bookingsSlice",
        "./UserBooking": "./src/UserBookingWithStore",
        "./BookingForm": "./src/booking/BookingForm",
        "./BookingList": "./src/booking/BookingList"
      }
      ,
      shared: {
        react: { singleton: true, requiredVersion: deps.react },
        "react-dom": { singleton: true, requiredVersion: deps["react-dom"] },
        "react-redux": { singleton: true, requiredVersion: deps["react-redux"] },
        "@reduxjs/toolkit": { singleton: true, requiredVersion: deps["@reduxjs/toolkit"] },
      },
    }),
    new HtmlWebpackPlugin({ template: "./public/index.html" }),
  ],
};
