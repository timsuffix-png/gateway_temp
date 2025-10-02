const path = require("path");
const { WebpackPlugin } = require("@electron-forge/plugin-webpack");

module.exports = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [
    { name: "@electron-forge/maker-squirrel" },
    { name: "@electron-forge/maker-zip" },
    { name: "@electron-forge/maker-deb" },
    { name: "@electron-forge/maker-rpm" },
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig: path.join(__dirname, "webpack.main.config.js"),
      renderer: {
        config: path.join(__dirname, "webpack.renderer.config.js"),
        entryPoints: [
          {
            name: "main_window",
            html: path.join(__dirname, "src/index.html"),
            js: path.join(__dirname, "src/renderer.tsx"),
            preload: {
              js: path.join(__dirname, "src/electron/preload.ts"),
            },
          },
        ],
      },
    }),
  ],
};
