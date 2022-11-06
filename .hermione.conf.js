const { BASE_URL } = require('./consts')

module.exports = {
  baseUrl: BASE_URL,
  gridUrl: 'http://127.0.0.1:4444/wd/hub',

  browsers: {
    chrome: {
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          binary: 'C:/Program Files/Google/Chrome Beta/Application/chrome.exe',
        },
      },
      windowSize: {
        width: 1200,
        height: 1000,
      },
      screenshotDelay: 2000,
    },
  },

  plugins: {
    'html-reporter/hermione': {
      path: 'hermione-html-report',
    },
  },
}
