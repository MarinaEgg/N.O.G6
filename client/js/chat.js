const query = (obj) =>
  Object.keys(obj)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
    .join("&");
const colorThemes = document.querySelectorAll('[name="theme"]');
const markdown = window.markdownit();
const message_box = document.getElementById(`messages`);
const message_input = document.getElementById(`message-input`);
const box_conversations = document.querySelector(`.top`);
const spinner = box_conversations.querySelector(".spinner");
const stop_generating = document.querySelector(`.stop_generating`);
const send_button = document.querySelector(`#send-button`);
const get_sep = "|||";
const copyButton = `<div class="copy-icon"> <img src="/assets/img/copy.png" height="14px" /> </div>`;
const likeButton = `<div class="like-icon"> <img src="/assets/img/like.png" height="14px" /> </div>`;
const dislikeButton = `<div class="dislike-icon"> <img src="/assets/img/dislike.png" height="14px" /> </div>`;

// Fonction pour générer l'avertissement dynamique
const getDynamicWarning = () => {
  const language = navigator.language.startsWith('fr') ? 'fr' : 'en';
  const warnings = {
    fr: "N.O.G peut faire des erreurs, assurez-vous de vérifier ses réponses",
    en: "N.O.G can make mistakes, make sure to verify its responses"
  };
  return `<span class="dynamic-warning">${warnings[language]}</span>`;
};

const actionsButtons = `<div class="actions">
                              ${copyButton}
                              ${likeButton}
                              ${dislikeButton}
                              ${getDynamicWarning()}
                          </div>`;
const loadingStream = `<span class="loading-stream"></span>`;
let prompt_lock = false;

// Messages de greeting mis à jour
const greetingMessages = {
  fr: "Bonjour. Je suis N.O.G – Nested Orchestration & Governance.\nJe suis conçu pour orchestrer et gouverner les interactions entre différents agents spécialisés, avec une capacité native de connexion à des systèmes tiers tels qu'iManage, entre autres.\n\nInteropérable avec plusieurs grands modèles de langage (GPT, Mistral, Claude), je prends en charge des opérations complexes tout en assurant une traçabilité fine et systématique de chaque interaction.\n\nCette architecture garantit une gouvernance robuste, conforme aux exigences des environnements juridiques professionnels.",
  en: "Hi. I am N.O.G – Nested Orchestration & Governance.\nI am designed to orchestrate and govern interactions between specialized agents, with native integration capabilities for third-party systems such as iManage, among others.\n\nInteroperable with leading large language models (GPT, Mistral, Claude), I support complex operations while ensuring fine-grained, systematic traceability of every interaction.\n\nThis architecture guarantees robust governance, aligned with the standards and expectations of professional legal environments."
};

hljs.addPlugin(new CopyButtonPlugin());
document.getElementsByClassName("library-side-nav-content")[0].innerHTML =
  onBoardingContent();

// Fonction pour redimensionner dynamiquement le textarea
function resizeTextarea(textarea) {
  // Reset height to auto to get the correct scrollHeight
  textarea.style.height = "auto";
  
  // Calculate new height based on content
  const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200);
  textarea.style.height = newHeight + "px";
  
  // Adjust the input box height accordingly
  const inputBox = textarea.closest('.input-box');
  if (inputBox) {
    inputBox.style.minHeight = (newHeight + 20) + "px";
  }
  
  // Ensure text is visible by scrolling to bottom
  textarea.scrollTop = textarea.scrollHeight;
}

function openLibrary() {
  document.getElementById("librarySideNav").style.width = "100vw";
  document.getElementById("menu").style.visibility = "visible";
}

function closeLibrary() {
  document.getElementById("librarySideNav").style.width = "0vw";
  document.getElementById("menu").style.visibility = "hidden";
}

async function openLinks(videoIdsParam, titlesParams) {
  document.getElementById("LinksSideNav").style.width = "100vw";
  document.getElementById("LinksSideNav").style.padding = "25px";
  document.getElementById("LinksSideNav").innerHTML = linksHTML();

  const video_ids = videoIdsParam.split(get_sep);
  const titles = titlesParams.split(get_sep);

  for (var i = 0; i < video_ids.length; i++) {
    const video_id = video_ids[i];
    const title = titles[i];
    const linksMenu = document.getElementById("linksMenu");
    linksMenu.innerHTML += `<button type="button" data-video-id="${video_id}" class="collapsible video-button onboarding-section">${title}</button>`;
  }

  var video_buttons = document.getElementsByClassName("video-button");
  var l;
  for (l = 0; l < video_buttons.length; l++) {
    const button = video_buttons[l];
    button.addEventListener("click", (event) => {
      const videoPlayer = document.getElementById(`link-video-iframe`);
      const videoId = button.getAttribute("data-video-id");

      videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
    });
  }
  document.getElementById("sideNavHeader").style.display = "flex";
}

function closeLinks() {
  document.getElementById("LinksSideNav").style.width = "0vw";
  document.getElementById("LinksSideNav").style.padding = "0px";
  document.getElementById("linksMenu").innerHTML = "";
}

class_last_message_assistant = "last-message-assistant";

const format = (text) => {
  return text.replace(/(?:\r\n|\r|\n)/g, "<br>");
};

message_input.addEventListener("blur", () => {
  window.scrollTo(0, 0);
});

const delete_conversations = async () => {
  localStorage.clear();
  await new_conversation();
};

const handle_ask = async () => {
  message_input.style.height = `40px`;
  message_input.focus();

  window.scrollTo(0, 0);
  let message = message_input.value;

  if (message.length > 0) {
    message_input.value = ``;
    // Reset textarea height after clearing
    resizeTextarea(message_input);
    await ask_gpt(message);
  }
};

const remove_cancel_button = async () => {
  stop_generating.classList.add(`stop_generating-hiding`);

  setTimeout(() => {
    stop_generating.classList.remove(`stop_generating-hiding`);
    stop_generating.classList.add(`stop_generating-hidden`);
  }, 300);
};

const ask_gpt = async (message) => {
  try {
    message_input.value = ``;
    message_input.innerHTML = ``;
    message_input.innerText = ``;

    add_conversation(window.conversation_id, message.substr(0, 20));
    window.scrollTo(0, 0);
    window.controller = new AbortController();

    model = document.getElementById("model");
    prompt_lock = true;
    window.text = ``;
    window.token = message_id();

    stop_generating.classList.remove(`stop_generating-hidden`);

    message_box.innerHTML += `
            <div class="message message-user">
                <div class="content" id="user_${token}">
                    ${format(message)}
                </div>
            </div>`;

    message_box.scrollTop = message_box.scrollHeight;
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);

    message_box.innerHTML += `
            <div class="message message-assistant">
            ${shape.replace(
              'id="shape"',
              `id="shape_assistant_${window.token}"`
            )}
                  ${loading_video.replace(
                    'id="nog_video"',
                    `id="assistant_${window.token}"`
                  )}
                <div class="content" id="imanage_${window.token}">
                    <div id="cursor"></div>
                </div>
            </div>
        `;

    message_box.scrollTop = message_box.scrollHeight;
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);

    const response = await fetch(`/backend-api/v2/conversation`, {
      method: `POST`,
      signal: window.controller.signal,
      headers: {
        "content-type": `application/json`,
        accept: `text/event-stream`,
      },
      body: JSON.stringify({
        conversation_id: window.conversation_id,
        action: `_ask`,
        model: model.options[model.selectedIndex]?.value,
        meta: {
          id: window.token,
          content: {
            conversation: await get_conversation(window.conversation_id),
            content_type: "text",
            parts: [
              {
                content: message,
                role: "user",
              },
            ],
          },
        },
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let pendingText = "";
    let isProcessing = false;
    const TYPING_SPEED = 7;

    const processPendingText = async (newText = "") => {
      if (newText) {
        pendingText += newText;
      }

      if (isProcessing) {
        return;
      }

      isProcessing = true;
      while (pendingText.length > 0) {
        const chars = pendingText.split("");
        pendingText = "";

        for (const char of chars) {
          text += char;
          document.getElementById(`imanage_${window.token}`).innerHTML =
            marked.parse(text);
          document.getElementById(
            `imanage_${window.token}`
          ).lastElementChild.innerHTML += loadingStream;
          message_box.scrollTop = message_box.scrollHeight;
          await new Promise((resolve) => setTimeout(resolve, TYPING_SPEED));
        }
      }
      isProcessing = false;
    };

    let links = [];
    language = "fr";
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process buffer line by line
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const eventData = line.slice(6).trim();
          if (eventData === "[DONE]") {
            await processPendingText();

            await writeNoRAGConversation(text, message, links);

            if (links.length !== 0) {
              await writeRAGConversation(links, text, language);
            }

            return;
          }

          const dataObject = JSON.parse(eventData);
          if (links.length === 0) {
            links = dataObject.metadata.links;
            changeEggImageToGPTImage();
          } else {
            changeEggImageToImanage();
          }
          language = dataObject.metadata.language;
          try {
            if (dataObject.response) {
              await processPendingText(dataObject.response);
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      }
    }

    let responseContent = [];

    add_message(window.conversation_id, "user", user_image, message);
  } catch (e) {
    document.getElementById(`shape_assistant_${window.token}`).src =
      "/assets/img/gpt_egg.png";
    document.getElementById(`assistant_${window.token}`).style.opacity = "0";

    add_message(window.conversation_id, "user", user_image, message);

    message_box.scrollTop = message_box.scrollHeight;
    await remove_cancel_button();
    prompt_lock = false;

    await load_conversations(20, 0);

    let cursorDiv = document.getElementById(`cursor`);
    if (cursorDiv) cursorDiv.parentNode.removeChild(cursorDiv);

    if (e.name != `AbortError`) {
      let error_message = `oops ! something went wrong, please try again / reload.`;

      document.getElementById(`imanage_${window.token}`).innerHTML =
        error_message;
      add_message(
        window.conversation_id,
        "assistant",
        gpt_image,
        error_message
      );
    } else {
      document.getElementById(
        `imanage_${window.token}`
      ).innerHTML += ` [aborted]`;

      add_message(
        window.conversation_id,
        "assistant",
        gpt_image,
        text + ` [aborted]`
      );
    }

    window.scrollTo(0, 0);
  }
};

function changeEggImageToImanage() {
  let imanageImageChanged = false;
  if (!imanageImageChanged) {
    document.getElementById(`shape_assistant_${window.token}`).style.content =
      "url(/assets/img/imanage_egg.png)";

    const imgElement = document.getElementById(`assistant_${window.token}`);
    imgElement.style.opacity = "0";
    imanageImageChanged = true;
  }
}

function changeEggImageToGPTImage() {
  let eggImageChanged = false;
  if (!eggImageChanged) {
    document.getElementById(`shape_assistant_${window.token}`).style.content =
      "url(/assets/img/gpt_egg.png)";
    const imgElement = document.getElementById(`assistant_${window.token}`);
    imgElement.style.opacity = "0";
    eggImageChanged = true;
  }
}

async function writeNoRAGConversation(text, message, links) {
  document.getElementById(`imanage_${window.token}`).innerHTML =
    marked.parse(text) + actionsButtons;
  const loadingStreamElement =
    document.getElementsByClassName("loading-stream")[0];

  if (loadingStreamElement) {
    loadingStreamElement.parentNode.removeChild(loadingStreamElement);
  }

  message_box.scrollTop = message_box.scrollHeight;
  await remove_cancel_button();
  prompt_lock = false;
  await load_conversations(20, 0);
  window.scrollTo(0, 0);

  add_message(window.conversation_id, "user", user_image, message);
  if (links.length === 0) {
    add_message(window.conversation_id, "assistant", gpt_image, text);
  } else {
    add_message(window.conversation_id, "assistant", imanage_image, text);
  }
}

async function writeRAGConversation(links, text, language) {
  responseContent = text;

  document.querySelectorAll(`code`).forEach((el) => {
    hljs.highlightElement(el);
  });

  video_ids = links.map((link) => getYouTubeID(link));

  const titles = await Promise.all(
    video_ids.map(async (video_id) => {
      const title = await fetchVideoTitle(video_id);
      return title;
    })
  );

  message_box.innerHTML += `
          <div class="message message-assistant">
              ${video_image}
            <div class="open-video-modal ${class_last_message_assistant} content" style="color: #3b68f1; text-decoration: underline; display: block; cursor: pointer;" onClick="openLinks(
        \`${video_ids.join(get_sep)}\`,
        \`${titles.join(get_sep)}\`
          )">
               ${
                 language === "en"
                   ? "Click here to watch videos"
                   : "Cliquez ici pour regarder les vidéos"
               }
            </div>
          </div>`;
  message_box.scrollTop = message_box.scrollHeight;
  const last_message_assistant = document.getElementsByClassName(
    class_last_message_assistant
  )[0];

  const scrolly = getScrollY(last_message_assistant);
  last_message_assistant.href = `/links/${conversation_id}/${scrolly}/${video_ids.join(
    get_sep
  )}/${titles.join(get_sep)}`;
  last_message_assistant.classList.remove(class_last_message_assistant);

  const links_and_language = {
    links: links,
    language: language,
    scrolly: scrolly,
    titles: titles,
  };
  add_message(
    window.conversation_id,
    "video_assistant",
    video_image,
    links_and_language
  );
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

function getScrollY(msg) {
  return Math.floor(message_box.scrollTop + msg.getBoundingClientRect().bottom);
}

const clear_conversations = async () => {
  const elements = box_conversations.childNodes;
  let index = elements.length;

  if (index > 0) {
    while (index--) {
      const element = elements[index];
      if (
        element.nodeType === Node.ELEMENT_NODE &&
        element.tagName.toLowerCase() !== `button`
      ) {
        box_conversations.removeChild(element);
      }
    }
  }
};

// Function to extract YouTube video ID
function getYouTubeID(url) {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

const clear_conversation = async () => {
  let messages = message_box.getElementsByTagName(`div`);

  while (messages.length > 0) {
    message_box.removeChild(messages[0]);
  }
};

const show_option = async (conversation_id) => {
  const conv = document.getElementById(`conv-${conversation_id}`);
  const yes = document.getElementById(`yes-${conversation_id}`);
  const not = document.getElementById(`not-${conversation_id}`);

  conv.style.display = "none";
  yes.style.display = "block";
  not.style.display = "block";
};

const hide_option = async (conversation_id) => {
  const conv = document.getElementById(`conv-${conversation_id}`);
  const yes = document.getElementById(`yes-${conversation_id}`);
  const not = document.getElementById(`not-${conversation_id}`);

  conv.style.display = "block";
  yes.style.display = "none";
  not.style.display = "none";
};

const delete_conversation = async (conversation_id) => {
  localStorage.removeItem(`conversation:${conversation_id}`);

  const conversation = document.getElementById(`convo-${conversation_id}`);
  conversation.remove();

  if (window.conversation_id == conversation_id) {
    await new_conversation();
  }

  await load_conversations(20, 0, true);
};

const set_conversation = async (conversation_id) => {
  history.pushState({}, null, `/chat/${conversation_id}`);
  window.conversation_id = conversation_id;

  await clear_conversation();
  await load_conversation(conversation_id);
  await load_conversations(20, 0, true);
};

const new_conversation = async () => {
  history.pushState({}, null, `/chat/`);
  window.conversation_id = uuid();

  await clear_conversation();
  
  // Afficher le message de greeting au début d'une nouvelle conversation
  const language = navigator.language.startsWith('fr') ? 'fr' : 'en';
  const greetingText = greetingMessages[language];
  
  // Ajouter le message de greeting
  message_box.innerHTML += `
    <div class="message message-assistant">
      ${nog_image}
      <div class="content">
        <div class="assistant-content" style="word-wrap: break-word; max-width: 100%; overflow-x: auto;">
          ${markdown.render(greetingText)}
        </div>
        ${actionsButtons}
      </div>
    </div>
  `;
  
  message_box.scrollTop = message_box.scrollHeight;
  
  await load_conversations(20, 0, true);
};

const load_conversation = async (conversation_id) => {
  let conversation = await JSON.parse(
    localStorage.getItem(`conversation:${conversation_id}`)
  );

  conversation?.items.forEach((item) => {
    const messageAlignmentClass =
      item.role === "user" ? "message-user" : "message-assistant";
    const img = item.image;
    if (item.role === "user" || item.role === "assistant") {
      message_box.innerHTML += `
          <div class="message ${messageAlignmentClass}">
            ${img}
            <div class="content">
              ${
                item.role === "assistant"
                  ? `<div class="assistant-content" style="word-wrap: break-word; max-width: 100%; overflow-x: auto;">${markdown.render(
                      item.content
                    )}</div>`
                  : item.content
              }
              ${item.role === "assistant" ? actionsButtons : ""}
            </div>
          </div>
        `;
    } else if (item.role === "video_assistant") {
      const links = item.content.links;
      const video_ids = links.map((link) => getYouTubeID(link));
      const titles = item.content.titles;

      const language = item.content.language;

      message_box.innerHTML += `
        <div class="message message-assistant">
        ${img}
          <div class="content" style="color: #3b68f1; text-decoration: underline; display: block; cursor: pointer;" onClick="openLinks(
          \`${video_ids.join(get_sep)}\`,
          \`${titles.join(get_sep)}\`
          )">
          ${
            language === "en"
              ? "Click here to watch videos"
              : "Cliquez ici pour regarder les vidéos"
          }
        </div>
        </div>`;
    }
  });

  document.querySelectorAll(`code`).forEach((el) => {
    hljs.highlightElement(el);
  });

  message_box.scrollTo({ top: message_box.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    message_box.scrollTop = message_box.scrollHeight;
  }, 500);
};

const get_conversation = async (conversation_id) => {
  let conversation = await JSON.parse(
    localStorage.getItem(`conversation:${conversation_id}`)
  );
  return conversation.items;
};

const add_conversation = async (conversation_id, title) => {
  if (localStorage.getItem(`conversation:${conversation_id}`) == null) {
    localStorage.setItem(
      `conversation:${conversation_id}`,
      JSON.stringify({
        id: conversation_id,
        title: title,
        items: [],
      })
    );
  }
};

const add_message = async (conversation_id, role, image, content) => {
  const conversation = JSON.parse(
    localStorage.getItem(`conversation:${conversation_id}`)
  );

  conversation.items.push({
    role: role,
    image: image,
    content: content,
  });

  localStorage.setItem(
    `conversation:${conversation_id}`,
    JSON.stringify(conversation)
  );
};

const load_conversations = async (limit, offset, loader) => {
  let conversations = [];
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).startsWith("conversation:")) {
      let conversation = localStorage.getItem(localStorage.key(i));
      conversations.push(JSON.parse(conversation));
    }
  }

  await clear_conversations();

  for (conversation of conversations) {
    box_conversations.innerHTML += `
    <div class="convo" id="convo-${conversation.id}">
      <div class="left" onclick="set_conversation('${conversation.id}')">
          <i class="fa-regular fa-comments"></i>
          <span class="convo-title">${conversation.title}</span>
      </div>
      <i onclick="show_option('${conversation.id}')" class="fa-regular fa-trash" id="conv-${conversation.id}"></i>
      <i onclick="delete_conversation('${conversation.id}')" class="fa-regular fa-check" id="yes-${conversation.id}" style="display:none;"></i>
      <i onclick="hide_option('${conversation.id}')" class="fa-regular fa-x" id="not-${conversation.id}" style="display:none;"></i>
    </div>
    `;
  }

  document.querySelectorAll(`code`).forEach((el) => {
    hljs.highlightElement(el);
  });
};

document.getElementById(`cancelButton`).addEventListener(`click`, async () => {
  window.controller.abort();
});

function h2a(str1) {
  var hex = str1.toString();
  var str = "";

  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }

  return str;
}

const uuid = () => {
  return `xxxxxxxx-xxxx-4xxx-yxxx-${Date.now().toString(16)}`.replace(
    /[xy]/g,
    function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
};

const message_id = () => {
  random_bytes = (Math.floor(Math.random() * 1338377565) + 2956589730).toString(
    2
  );
  unix = Math.floor(Date.now() / 1000).toString(2);

  return BigInt(`0b${unix}${random_bytes}`).toString();
};

window.onload = async () => {
  load_settings_localstorage();

  conversations = 0;
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).startsWith("conversation:")) {
      conversations += 1;
    }
  }

  if (conversations == 0) localStorage.clear();

  await setTimeout(() => {
    load_conversations(20, 0);
  }, 1);

  if (!window.location.href.endsWith(`#`)) {
    if (/\/chat\/.+/.test(window.location.href)) {
      await load_conversation(window.conversation_id);
    }
  }

  message_input.addEventListener(`keydown`, async (evt) => {
    if (prompt_lock) return;
    if (evt.keyCode === 13 && !evt.shiftKey) {
      evt.preventDefault();
      await handle_ask();
    } else {
      // Auto-resize on input
      setTimeout(() => resizeTextarea(message_input), 0);
    }
  });

  // Auto-resize on input event
  message_input.addEventListener(`input`, () => {
    resizeTextarea(message_input);
  });

  send_button.addEventListener(`click`, async () => {
    if (prompt_lock) return;
    await handle_ask();
  });

  register_settings_localstorage();
};

document.querySelector(".mobile-sidebar").addEventListener("click", (event) => {
  const sidebar = document.querySelector(".conversations");

  if (sidebar.classList.contains("shown")) {
    sidebar.classList.remove("shown");
    event.target.classList.remove("rotated");
  } else {
    sidebar.classList.add("shown");
    event.target.classList.add("rotated");
  }

  window.scrollTo(0, 0);
});

const register_settings_localstorage = async () => {
  settings_ids = ["model"];
  settings_elements = settings_ids.map((id) => document.getElementById(id));
  settings_elements.map((element) =>
    element.addEventListener(`change`, async (event) => {
      switch (event.target.type) {
        case "checkbox":
          localStorage.setItem(event.target.id, event.target.checked);
          break;
        case "select-one":
          localStorage.setItem(event.target.id, event.target.selectedIndex);
          break;
        default:
          console.warn("Unresolved element type");
      }
    })
  );
};

const load_settings_localstorage = async () => {
  settings_ids = ["model"];
  settings_elements = settings_ids.map((id) => document.getElementById(id));
  settings_elements.map((element) => {
    if (localStorage.getItem(element.id)) {
      switch (element.type) {
        case "checkbox":
          element.checked = localStorage.getItem(element.id) === "true";
          break;
        case "select-one":
          element.selectedIndex = parseInt(localStorage.getItem(element.id));
          break;
        default:
          console.warn("Unresolved element type");
      }
    }
  });
};

// Theme storage for recurring viewers
const storeTheme = function (theme) {
  localStorage.setItem("theme", theme);
};

// set theme when visitor returns
const setTheme = function () {
  const activeTheme = localStorage.getItem("theme");
  colorThemes.forEach((themeOption) => {
    if (themeOption.id === activeTheme) {
      themeOption.checked = true;
    }
  });
  // fallback for no :has() support
  document.documentElement.className = activeTheme;
  // scroll if requested
  if (back_scrolly >= 0) {
    message_box.scrollTo({ top: back_scrolly, behavior: "smooth" });
  }
};

colorThemes.forEach((themeOption) => {
  themeOption.addEventListener("click", () => {
    storeTheme(themeOption.id);
    // fallback for no :has() support
    document.documentElement.className = themeOption.id;
  });
});

document.onload = setTheme();

// ONBOARDING

hljs.addPlugin(new CopyButtonPlugin());

function onBoardingContent() {
  return `
    <div class="side-nav-header" id="sideNavHeader">
      <a onClick="closeLibrary()"
        style="
          color: #2f2f2e;
          text-decoration: none;
          display: inline-block;
          margin-left: 10px;
          align-items: center;
          cursor: pointer">
          <div class="fa fa- fa-arrow-left" style="margin-right: 5px;"></div>
                  Retour à la conversation
      </a>
      <img
        style="width: 25px"
        src="/assets/img/nog_logo_no_text.png"
        alt="logo"
      />

    </div>

    <div class="row">
      <div id="menu" style="width: 40%"></div>

      <div class="box" id="video-panel" style="border: none; width: 70%">
        <div style="display: block; justify-content: left; align-items: center">
          <iframe
            id="video-iframe"
            width="800"
            height="400"
            src="https://www.youtube.com/embed/4nlMKhcYLNM"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>
  `;
}

const onboarding_sections = [
  {
    name: "iManage Work",
    "sub-sections": [],
    img_path: "/assets/img/imanage_onboarding.png",
  },
  {
    name: "iManage Closing Folders",
    "sub-sections": [
      { name: "Créer un projet & Importer un agenda", video_id: "4nlMKhcYLNM" },
      {
        name: "Importer un agenda depuis Word ou Excel",
        video_id: "BvBPAi6an_c",
      },
      { name: "Modifier l'agenda", video_id: "PypN_G-Wy_I" },
      { name: "Ajouter un préambule", video_id: "94q6QoMycvA" },
      {
        name: "Importer des fichiers individuellement",
        video_id: "HX_FQLxq4Aw",
      },
      {
        name: "Importer plusieurs fichiers à la fois",
        video_id: "2DO9nbAcjVs",
      },
      { name: "Configurez vos pages de signatures", video_id: "M66Ihcvn1-k" },
      { name: "Générateur de pages de signatures", video_id: "rgo5SuQUZ8g" },
      {
        name: "Compilez vos paquets de signatures dans un PDF",
        video_id: "8_xusu7ddx8",
      },
      {
        name: "Compilez vos paquets de signatures dans DocuSign",
        video_id: "cc0n-Rffcws",
      },
      { name: "Comment utiliser des variables", video_id: "5RmCLCxwknA" },
      { name: "Comment dissocier les variables", video_id: "pI5Puq08NAg" },
      { name: "Finaliser les documents", video_id: "RM3FUhj0Arc" },
    ],
    img_path: "/assets/img/imanage_onboarding.png",
  },
  {
    name: "iManage Work 10",
    "sub-sections": [],
    img_path: "/assets/img/imanage_onboarding.png",
  },
  {
    name: "iManage Share",
    "sub-sections": [],
    img_path: "/assets/img/imanage_onboarding.png",
  },
  {
    name: "iManage Drive",
    "sub-sections": [],
    img_path: "/assets/img/imanage_onboarding.png",
  },
  {
    name: "Litera",
    "sub-sections": [],
    img_path: "/assets/img/litera_onboarding.png",
  },
  {
    name: "BigHand",
    "sub-sections": [],
    img_path: "/assets/img/bighand_onboarding.png",
  },
  { name: "AI", "sub-sections": [], img_path: "/assets/img/ai_onboarding.png" },
  {
    name: "Power BI",
    "sub-sections": [],
    img_path: "/assets/img/powerbi_onboarding.png",
  },
];

const menu = document.getElementById("menu");

// loop over sections

for (var i = 0; i < onboarding_sections.length; i++) {
  const section_name = onboarding_sections[i]["name"];
  const img_url = onboarding_sections[i]["img_path"];
  const div_section_id = `div_${section_name}`;
  const button_section_id = `div_${section_name}`;
  menu.innerHTML += `<button id="button_${section_name}" type="button" class="collapsible onboarding-section"><img src="${img_url}" style="float:left; margin-right:0.5em; width:30px; vertical-align: middle;">${section_name}</button>`;
  menu.innerHTML += `<div class="onboard-collapsible-content" id="div_${section_name}"></div>`;
  const section = document.getElementById(div_section_id);
  // loop over sub sections
  const sub_sections = onboarding_sections[i]["sub-sections"];
  const n_sub_sections = sub_sections.length;
  if (n_sub_sections > 0) {
    for (var j = 0; j < n_sub_sections; j++) {
      const sub_section_name = sub_sections[j]["name"];
      const video_id = sub_sections[j]["video_id"];
      const num = j < 10 ? `0${j + 1}` : `${j + 1}`;
      section.innerHTML += `<button id="${video_id}" data-video-id="${video_id}" class="video-button onboarding-subsection" style="background: white; display:inline-block"> ${num}- ${sub_section_name} </button>`;
    }
  } else {
    // no need to make the section button collapsible
    document.getElementById(button_section_id).classList.remove("collapsible");
  }
}

// change video on click
var video_buttons = document.getElementsByClassName("video-button");
var l;
for (l = 0; l < video_buttons.length; l++) {
  const button = video_buttons[l];
  button.addEventListener("click", (event) => {
    const videoPlayer = document.getElementById(`video-iframe`);
    const videoId = button.getAttribute("data-video-id");
    videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
  });
}

// magic behind collapsibles
var coll = document.getElementsByClassName("collapsible");
var i;
for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function () {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}

// LINKS

// const videoPlayer = document.getElementById(`video-iframe`);

// Function to fetch video title from YouTube oEmbed API