// 要素取得のショートカット
const $ = sel => document.querySelector(sel);
const create = el => document.createElement(el);
let isReplying = false;
let ChatIndex = 0;

// タイトルのアニメーション付き切り替え
const titleText = $('#title-text');
const titleTexts = [
  "会えてうれしいです。何か変わったことはありますか？",
  "今日はどんなことを考えていますか？",
  "ようこそ。今日は何について掘り下げましょうか？",
  "お手伝いできることはありますか？",
  "今日は何をしましょうか？",
  "始めましょうか",
  "どこから始めますか？",
  "どんなことをしてますか？"
];

// テキスト切り替え関数（フェード付き）
function updateTitle() {
  titleText.classList.add('fade-out');
  setTimeout(() => {
    // 前回と同じにならないように選ぶ
    let newTitle;
    do {
      newTitle = titleTexts[Math.floor(Math.random() * titleTexts.length)];
    } while (newTitle === titleText.textContent);

    titleText.textContent = newTitle;

    titleText.classList.remove('fade-out');
    titleText.classList.add('fade-in');

    setTimeout(() => titleText.classList.remove('fade-in'), 300);
  }, 300);
}


updateTitle();
setInterval(updateTitle, 5000);

(async () => {
  const params = new URLSearchParams(window.location.search);
  const prompt = params.get('prompt');
  const query = params.get('q');
  
  if (prompt) {
    // 入力欄に反映
    $('#prompt').value = decodeURIComponent(prompt);
  
    // URLから ?prompt=... を削除（リロードなし）
    const url = new URL(window.location);
    url.searchParams.delete('prompt');
    window.history.replaceState({}, '', url);
  }
  if (query) {
    chatScreen.classList.add('started');
    await sendMessage(decodeURIComponent(query));
  
    const url = new URL(window.location);
    url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  }
})();

const dummyFiles = $('#file-dummy');
const fileInput = $('#up-file');
let files = [];

dummyFiles.addEventListener('click', () => {
  fileInput.value = '';
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const selectedFiles = Array.from(fileInput.files);
  selectedFiles.forEach(file => {
    const exists = files.some(f =>
      f.name === file.name &&
      f.size === file.size &&
      f.lastModified === file.lastModified
    );
    if (!exists) files.push(file);
  });
  renderFileList();
});

function renderFileList() {
  const container = $('#upload-files');
  if (!container) return;

  let list = container.querySelector('.file-list');
  if (!list) {
    list = create('ul');
    list.className = 'file-list';
    container.appendChild(list);
  }

  // 既存ファイルのキーをまとめて取得
  const existingKeys = new Set(
    Array.from(list.children).map(li => li.dataset.key)
  );

  const fragment = document.createDocumentFragment();

  for (const file of files) {
    const key = ${file.name}-${file.size}-${file.lastModified};
    if (existingKeys.has(key)) continue;

    const li = create('li');
    li.dataset.key = key;

    const url = URL.createObjectURL(file);
    const link = create('a');
    link.href = url;
    link.target = '_blank';

    if (file.type.startsWith('image/')) {
      const img = create('img');
      Object.assign(img.style, {
        maxWidth: '80px',
        maxHeight: '80px',
        borderRadius: '6px'
      });
      img.src = url;
      img.alt = file.name;
      link.appendChild(img);
    } else {
      link.textContent = 📄 ${file.name};
    }

    const closeBtn = create('button');
    closeBtn.textContent = '✕';
    closeBtn.className = 'file-close';
    closeBtn.addEventListener('click', () => {
      files = files.filter(f =>
        !(f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)
      );
      li.remove();
      URL.revokeObjectURL(url);
    });

    li.append(link, closeBtn);
    fragment.appendChild(li);
  }

  list.appendChild(fragment);
}


const showfiles = $('#file-list');
const showscreen = $('#upload-files')
showfiles.onclick = () => {
  showscreen.classList.add('open');
  renderFileList();
}
const closescreen = $('#files-close');
closescreen.onclick = () => {
  showscreen.classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (showscreen.classList.contains('open')) {
    showscreen.classList.remove('open');
  }
});
// メニュー開閉処理
const menuToggle = $('#menu-toggle');
const sideMenu = $('#side-menu');

menuToggle.addEventListener('click', toggleMenu);

menuToggle.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); // Spaceでスクロールしないように
    toggleMenu();
  }
});

function renderMarkdown(text) {
  let html = marked.parse(text);
  html = DOMPurify.sanitize(html);
  html = html.replace(/^<p>|<\/p>$/g, "");
  return html.trim();
}

function toggleMenu() {
  sideMenu.classList.toggle('open');
  menuToggle.classList.toggle('open');
}

// メッセージ送信処理
const textarea = $('#prompt');
const chatScreen = $('#chat-screen');
const mainScreen = $('#main-chat');

async function sendMessage(msg) {
  const message = msg.trim();
  if (!message) return;

  chatScreen.classList.add('started');
  console.log("送信:" , message);
  textarea.value = "";

  const ChatME = $('#chat-clone .chat-me');

  const CloneChatME = ChatME.cloneNode(true);
  const meTextElement = CloneChatME.querySelector('.text');
  meTextElement.id = chat-${ChatIndex};
  ChatIndex++;
  meTextElement.innerHTML = renderMarkdown(message);

  mainScreen.appendChild(CloneChatME);
  mainScreen.scrollTop = mainScreen.scrollHeight;

  const ChatAI = $('#chat-clone .chat-ai');
  const CloneChatAI = ChatAI.cloneNode(true);
  const aiTextElement = CloneChatAI.querySelector('.text');
  mainScreen.appendChild(CloneChatAI);
  aiTextElement.id = chat-${ChatIndex};
  ChatIndex++;
  
  let response = "AIからの返答がありませんでした";
  if (message.startsWith("\\")) {
    const spaceIndex = message.indexOf(" ", 1);
    const command = spaceIndex === -1 ? message.slice(1) : message.slice(1, spaceIndex);
    const args = spaceIndex === -1 ? "" : message.slice(spaceIndex + 1);
  
    if (typeof API[command] === "function") {
      try {
        response = await API[command](args);
        if (response.trim() === "") response = "コマンドの応答がありませんでした";
      } catch (err) {
        response = コマンド実行エラー: ${err.message || err};
      }
    } else {
      response = 不明なコマンドです: ${command};
    }
  } else {
    response = await API.send(message);
  }

  typeWriterEffect(aiTextElement, response, 0);
}

function typeWriterEffect(element, text, speed = 50) {
  isReplying = true;
  element.textContent = "";
  
  let i = 0;
  let buffer = "";

  function typing() {
    if (i < text.length) {
      buffer += text[i];
      element.textContent = buffer; // ← プレーンテキストで出す
      i++;
      setTimeout(typing, speed);
    } else {
      element.innerHTML = renderMarkdown(text);
      isReplying = false;
    }
  }

  typing();
}


textarea.addEventListener('keydown', e => {
  if (e.key === "Enter" && !e.shiftKey && !isReplying) {
    e.preventDefault();
    sendMessage(textarea.value);
  }
});