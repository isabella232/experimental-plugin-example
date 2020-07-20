// browser.runtime.onMessage.addListener(message => {
//   if (message.type === 'GREETING') {
//     return new Promise(resolve =>
//       setTimeout(() => resolve('Hi! Got your message a second ago.'), 1000)
//     )
//   }
// })

// Open the UI to navigate the collection images in a tab.
browser.browserAction.onClicked.addListener(() => {
  return new Promise(resolve =>
    browser.tabs.create({url: "/popup.html"}).then(resolve)
  )
});