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
          () => {} // no callback needed
        );
      }
    );
  }
});
