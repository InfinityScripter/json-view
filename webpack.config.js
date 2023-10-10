const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/json-view.js",
  output: {
    filename: "jsonview.js",
    library: {
      name: "jsonview",
      type: "umd",
    },
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    static: path.join(__dirname, "demo"),
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Добавляем это правило для обработки JS файлов
        exclude: /node_modules/, // Исключаем папку node_modules
        use: {
          loader: "babel-loader", // Используем babel-loader
          options: {
            presets: ["@babel/preset-env"], // Предустанавливаемые настройки
          },
        },
      },
      {
        test: /\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
};
