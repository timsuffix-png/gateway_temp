const path = require("path");
const {
  AutoUnpackNativesPlugin,
} = require("@electron-forge/plugin-auto-unpack-natives");

module.exports = {
  packagerConfig: {
    icon: path.resolve(__dirname, "public/favicon"),
    asar: true,
    extraResource: [
      path.resolve(__dirname, "out"),
    ],
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        setupIcon: path.resolve(__dirname, "public/favicon.ico"),
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [new AutoUnpackNativesPlugin()],
};
