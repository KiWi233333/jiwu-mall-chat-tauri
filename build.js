
const builder = require("electron-builder");

const Platform = builder.Platform;

/**
 * @type {import('electron-builder').Configuration}
 */
const options = {
  appId: "com.app.id",
  productName: "极物圈",
  // protocols: {
  // name: 'Your deeplink',
  // - Don't forget to set `MimeType: "x-scheme-handler/deeplink"` for `linux.desktop` entry!
  // schemes: ['deeplink']
  // },
  // - Electron auto-updater config
  publish: [
    {
      provider: "github",
      owner: "eternalc0der",
      repo: "极物圈",
      releaseType: "release",
    },
  ],

  // "store" | "normal" | "maximum" - For testing builds, use 'store' to reduce build time significantly.
  compression: "store",
  removePackageScripts: true,

  nodeGypRebuild: false,
  buildDependenciesFromSource: false,

  directories: {
    output: "electron-dist",
  },
  // windows
  win: {
    // eslint-disable-next-line no-template-curly-in-string
    artifactName: "${productName}-${version}.${ext}",
    target: [
      {
        target: "nsis",
        arch: ["x64", "ia32"],
      },
    ],
    icon: "./public/logo.png",
  },
  mac: {
    category: "public.app-category.entertainment",
    hardenedRuntime: false,
    gatekeeperAssess: false,
    target: [
      {
        target: "default",
        arch: ["x64", "arm64"],
      },
    ],
    icon: "./public/logo.png",
  },
  linux: {
    maintainer: "极物圈",
    desktop: {
      StartupNotify: "false",
      Encoding: "UTF-8",
      MimeType: "x-scheme-handler/deeplink",
    },
    target: ["AppImage", "rpm", "deb"],
    icon: "./public/logo.png",
  },
  nsis: {
    oneClick: false,
    guid: "idea",
    perMachine: true,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    installerIcon: "./public/logo.png",
    uninstallerIcon: "./public/logo.png",
    installerHeaderIcon: "./public/logo.png",
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "idea",
  },
};

const platform = "WINDOWS"; // "MAC" | "LINUX" | "WINDOWS" - Change this to build for other platforms
builder
  .build({
    targets: Platform[platform].createTarget(),
    config: options,
  })
  .then((result) => {
    console.log("----------------------------");
    console.log("Platform:", platform);
    console.log("Output:", JSON.stringify(result, null, 2));
  });
