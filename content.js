const youtubeBaseUrl = "https://www.googleapis.com/youtube/v3/";
const youtubeAPIKey = config.youtubeAPIKey; // read this from config file
let videoIdToDivs = {}; // map of video ids to the divs that link to this video
let strayDivIds = [];
let videoInformation = {}; // map of video id to info object
let videoIdToComments = {};

let commentsToDisplay = 3;
let ratingsToFilter = 0;

// TODO: Don't remove for now, so the options get persisted across browser refresh
// chrome.storage.local.remove(
//   ["commentsToDisplay", "ratingsToFilter"],
//   function() {
//     var error = chrome.runtime.lastError;
//     if (error) {
//       console.error(error);
//     }
//   }
// );

// remove all stray divs from document, clear all the variables, read commentsToDisplay and ratingsToFilter from storage
function performCleanup() {
  for (let divId of strayDivIds) {
    const strayDiv = document.getElementById(divId);
    if (strayDiv) {
      strayDiv.remove();
    }
  }
  strayDivIds = [];
  videoIdToDivs = {};
  videoInformation = {};
  videoIdToComments = {};

  chrome.storage.local.get(["commentsToDisplay", "ratingsToFilter"], function(
    result
  ) {
    if (result.commentsToDisplay)
      commentsToDisplay = parseInt(result.commentsToDisplay);
    if (result.ratingsToFilter)
      ratingsToFilter = parseInt(result.ratingsToFilter);
  });
}

// given a list of videoIds, return a list of compacted (comma-separated) strings
function getPaginatedVideoIds(videoIds) {
  const res = [];
  let ind = 0;

  // process 50 links at once
  while (ind < videoIds.length) {
    let hrefString = "";
    for (let i = 0; i < 50; i++) {
      const actualInd = ind + i;
      const videoId = videoIds[actualInd];

      // append to string
      if (hrefString.length === 0) {
        hrefString = videoId;
      } else {
        hrefString += ",";
        hrefString += videoId;
      }
    }
    res.push(hrefString);
    ind += 50;
  }
  return res;
}

// takes href string and returns videoId
function stripLink(link) {
  if (link.indexOf("?v=") === -1) return null;
  const start = link.indexOf("?v=") + 3;
  let end = link.length;
  if (link.indexOf("&", start) !== -1) {
    end = link.indexOf("&");
  }
  return link.slice(start, end);
}

// makes the API call and does the processing of server call response
async function processVideosList(videoIdsString) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      youtubeBaseUrl +
        `videos?key=${youtubeAPIKey}&part=snippet,statistics&id=${videoIdsString}`,
      true
    );
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        const response = JSON.parse(xhr.responseText);
        if (!response.items) {
          console.error(
            `Error: the videos response does not have 'items' property`
          );
          console.log(response);
          reject(response);
        }

        // loop through items and parse the information
        response.items.forEach(function(item) {
          const likes = parseInt(item.statistics.likeCount);
          const dislikes = parseInt(item.statistics.dislikeCount);
          const likePercentage =
            likes + dislikes > 0
              ? Math.round((likes / (likes + dislikes)) * 100)
              : 100;

          // comment count of -1 means comments disabled
          let commentCnt = parseInt(item.statistics.commentCount);
          if (isNaN(commentCnt)) {
            commentCnt = -1;
          }

          videoInformation[item.id] = {
            likes: likes,
            dislikes: dislikes,
            likePercentage: likePercentage,
            commentCount: commentCnt
          };

          // print out aggregated info
          // console.log("-------------------------------");
          // console.log(item.snippet.title);
          // console.log(
          //   `likes: ${likes} dislikes: ${dislikes}  Like Percentage: ${likePercentage}`
          // );

          resolve(videoInformation);
        });
      } else {
        console.log(
          `The XMLHttpRequest readyState changed to ${xhr.readyState}`
        );
      }
    };
    xhr.send();
  });
}

// make comments API request to get top comments
function getCommentsForVideo(videoId, commentCount) {
  return new Promise((resolve, reject) => {
    if (commentCount <= 0) {
      resolve("");
    }
    if (videoIdToComments[videoId]) {
      resolve(videoIdToComments[videoId]);
    }

    // get # of pages to fetch
    const pagesToFetch =
      commentCount > 1000 ? 10 : Math.floor((commentCount - 1) / 100) + 1;

    const commentsList = [];
    const request = new XMLHttpRequest();

    // recursive function that runs until pagesToFetch is reached or no more comments
    console.log("COMMENTS TO DISPLAY: " + commentsToDisplay);
    (function loop(i, nextPageToken) {
      if (i > pagesToFetch || (i > 1 && !nextPageToken)) {
        commentsList.sort((a, b) => {
          return b.likes - a.likes;
        });

        let tooltipText = "";
        for (let x = 0; x < commentsToDisplay; x++) {
          if (x >= commentsList.length) break;
          if (x > 0) {
            tooltipText += "\r\n\r\n";
          }
          tooltipText +=
            "+" +
            commentsList[x].likes +
            "\r\n" +
            commentsList[x].author +
            "\r\n" +
            commentsList[x].text;
        }

        videoIdToComments[videoId] = tooltipText;
        resolve(tooltipText);
        return;
      }

      const nextPageSuffix = i > 1 ? `&pageToken=${nextPageToken}` : "";
      const url =
        youtubeBaseUrl +
        `commentThreads?key=${youtubeAPIKey}&part=id,snippet&videoId=${videoId}&maxResults=100&textFormat=plainText${nextPageSuffix}`;

      request.open("GET", url);
      request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
          // some error checking
          if (request.status !== 200) {
            reject("error: the request status return " + request.status);
            return;
          }
          const response = JSON.parse(request.responseText);
          if (!response.items) {
            console.error(`Error: the response does not have 'items' property`);
            console.log(response);
            reject(response);
            return;
          }

          // accumulate comment text and likes
          response.items.forEach(function(item) {
            if (item.snippet.topLevelComment) {
              const comment = item.snippet.topLevelComment.snippet;
              commentsList.push({
                likes: comment.likeCount,
                author: comment.authorDisplayName,
                text: comment.textDisplay
              });
            }
          });

          // recursively call the next page
          loop(i + 1, response.nextPageToken);
        } else {
          console.log(
            `The XMLHttpRequest readyState for commentThreads changed to ${request.readyState}`
          );
        }
      };

      request.send();
    })(1, "");
  });
}

chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  if (msg.text === "report_back") {
    // return the dom back to backgrounds.js
    sendResponse({ dom: document });

    // cleanup state variables
    performCleanup();

    const anchors = document.getElementsByTagName("a");

    // for each anchor element, strip the videoId and map it to its parent divs
    for (let anchor of anchors) {
      const videoId = stripLink(anchor.href);
      if (!videoId) continue;

      const parentDiv = anchor.closest("div");
      if (parentDiv.id !== "dismissable") continue;

      if (!videoIdToDivs[videoId]) {
        videoIdToDivs[videoId] = [];
      }
      videoIdToDivs[videoId].push(parentDiv);
    }

    const compactedVideoIdList = getPaginatedVideoIds(
      Object.keys(videoIdToDivs)
    );

    let x = 1; // DEBUG PURPOSES ONLY
    if (x === 1) {
      for (let compactedVideoIds of compactedVideoIdList) {
        await processVideosList(compactedVideoIds);
      }

      // insert the new divs with the video information
      for (let videoId of Object.keys(videoIdToDivs)) {
        for (let parentDiv of videoIdToDivs[videoId]) {
          const videoInfo = videoInformation[videoId];
          if (!videoInfo) {
            continue;
          }

          // remove videos with < 60% like percentage
          if (videoInfo.likePercentage < ratingsToFilter) {
            parentDiv.remove();
            continue;
          }

          const div = document.createElement("div");
          div.id = videoId;
          strayDivIds.push(div.id);
          parentDiv.appendChild(div);

          div.style.position = "absolute";
          div.style.padding = "3px";

          // set the background color based on like percentage
          if (videoInfo.likes + videoInfo.dislikes === 0) {
            div.style.color = "black";
            div.style.background = "white";
          } else if (videoInfo.likePercentage >= 90) {
            div.style.color = "white";
            div.style.background = "green";
          } else if (videoInfo.likePercentage >= 60) {
            div.style.color = "black";
            div.style.background = "yellow";
          } else {
            div.style.color = "white";
            div.style.background = "red";
          }

          // set the info on the div
          div.textContent = `${videoInfo.likes} \\ ${
            videoInfo.likePercentage
          }% \\ ${
            videoInfo.commentCount == -1
              ? "Comments Disabled"
              : videoInfo.commentCount
          }`;

          div.onmouseover = function() {
            div.title = "Loading comments...";
            getCommentsForVideo(videoId, videoInfo.commentCount).then(
              response => {
                div.title = response;
              }
            );
          };
        }
      }
    }
  }

  sendResponse({
    msg: "Error: content.js received unexpected message from sender:",
    sender: sender
  });
});
