<h4 align="center">
  Youtube Preview
</h4>

## :exclamation: About

The Youtube Preview extension allows you preview the ratings and top-voted comments of youtube videos from the search page.

## How To Use

1. Search for videos on https://www.youtube.com/

2. Use the Ctrl+Shift+Q keyboard shortcut to trigger the extension

3. Hover over the like percentage overlay in order to preview the most liked comments (as a tooltip).

### Settings

Clicking on the extension's icon in the browser toolbar will allow you to control the following settings:
- The number of top comments to preview in the hover tooltip
- The ability to filter out videos in the search results below a certain like percentage. In order to refresh the search page, use Ctrl+Shift+Q again.

## :information_source: Installation

1. Clone this repository (Note: you'll need [Git](https://git-scm.com))
```bash
git clone https://github.com/jy-whatthetech/yt-ratings.git
```

2. Obtain a Youtube API key and put it in config.js file:
  2a. Follow the instructions here to obtain an API Key for Youtube: https://developers.google.com/youtube/registering_an_application
  2b. create a file named "config.js" and put it under the root folder of the extensions folder

3. Go to chrome://extensions/

4. Select the "Load Unpacked" button, and choose the "yt-ratings" folder.

5. You should now see "Youtube Preview" in your list of loaded extensions.

6. Browse Youtube and start using!

