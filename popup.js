document.addEventListener("DOMContentLoaded", documentEvents, false);

function documentEvents() {
  chrome.storage.local.get(["commentsToDisplay", "ratingsToFilter"], function(
    result
  ) {
    if (result.commentsToDisplay) {
      const val = parseInt(result.commentsToDisplay);
      document.getElementById("commentsSlider").value = val;
      document.getElementById(
        "commentsLabel"
      ).innerText = `Number of comments to display: ${val}`;
    }

    if (result.ratingsToFilter) {
      const val = parseInt(result.ratingsToFilter);
      document.getElementById("ratingsSlider").value = val;
      document.getElementById(
        "ratingsLabel"
      ).innerText = `Filter out videos below: ${val}%`;
    }
  });

  document
    .getElementById("commentsSlider")
    .addEventListener("input", function() {
      const val = document.getElementById("commentsSlider").value;

      chrome.storage.local.set({ commentsToDisplay: val }, function() {});

      document.getElementById(
        "commentsLabel"
      ).innerText = `Number of comments to display: ${val}`;
    });

  document
    .getElementById("ratingsSlider")
    .addEventListener("input", function() {
      const val = document.getElementById("ratingsSlider").value;

      chrome.storage.local.set({ ratingsToFilter: val }, function() {});

      document.getElementById(
        "ratingsLabel"
      ).innerText = `Filter out videos below: ${val}%`;
    });
}
