function doStuffWithDom(resp) {
  if (resp.dom) {
    console.log("I received the following DOM content:\n" + resp.dom);
  } else {
    console.error(resp.msg);
    console.log(resp.sender);
  }
}

chrome.browserAction.onClicked.addListener(function(tab) {
  //chrome.tabs.sendMessage(tab.id, { text: "report_back" }, doStuffWithDom);
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === "toggle-feature") {
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true
      },
      function(tabs) {
        var tab = tabs[0];
        chrome.tabs.sendMessage(
          tab.id,
          { text: "report_back" },
          doStuffWithDom
        );
      }
    );
  }
});
