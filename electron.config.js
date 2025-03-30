module.exports = {
  appId: 'com.web3digitalidentity.app',
  productName: 'Web3 Digital Identity',
  directories: {
    output: 'dist-electron',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'package.json',
  ],
  mac: {
    category: 'public.app-category.utilities',
    target: ['dmg', 'zip'],
  },
  win: {
    target: ['nsis', 'portable'],
  },
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Utility',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
  publish: {
    provider: 'github',
    owner: 'your-github-username',
    repo: 'web3-digital-identity',
  },
}; 