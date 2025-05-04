function linksHTML() {
  return `<div class="side-nav-header">
    <a
        id="back-button"
        onClick="closeLinks()"
        style="
          color: rgba(0, 0, 0, 0.8);
          text-decoration: none;
          display: inline-block;
          margin-left: 10px;
          align-items: center;
          cursor: pointer
        ">
        <div class="fa fa- fa-arrow-left" style="margin-right: 5px"></div>
        Retour à la conversation
        
    </a>
    <img
        width="25px"
        height="25px"
        src="/assets/img/nog_logo_no_text.png"
        alt="logo"
      />
      
    </div>

    <div class="link-content">
      <div id="linksMenu" style="width: 40%"></div>

      <div class="box" id="video-panel" style="border: none; width: 70%">
        <div style="display: block; justify-content: left; align-items: center">
          <iframe
            id="link-video-iframe"
            width="800"
            height="400"
            src="https://www.youtube.com/embed/4nlMKhcYLNM"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>`;
}

async function fetchVideoTitle(videoID) {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoID}&format=json`
  );
  if (response.ok) {
    const data = await response.json();
    title = data.title;
    const cleanTitle = title.replace(/^\d+ - /, "");
    return cleanTitle; // Return the title of the video
  }
  return null;
}

// for debug
function InputFetch(videoID) {
  return `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoID}&format=json`;
}
