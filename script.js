const viewer = document.getElementById('viewer');
const fileInput = document.getElementById('fileInput');
const bindingBtn = document.getElementById('bindingBtn');
const themeBtn = document.getElementById('themeBtn');
const sortBtn = document.getElementById('sortBtn');

let isSortMode = false;
let isRightBinding = true;
let selectedPage = null;

/* =========================
   自然順ソート
========================= */
function naturalSort(a, b) {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

/* =========================
   画像読み込み
========================= */
fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  const srcList = files.sort(naturalSort).map(f => URL.createObjectURL(f));
  rebuildFromPages(srcList);
});

/* =========================
   再構築（メイン）
========================= */
function rebuildFromPages(pages) {
  viewer.innerHTML = '';

  let pageNum = 1;

  // 表紙
  if (pages[0]) {
    viewer.appendChild(createSpread(pages.slice(0, 1), pageNum++));
  }

  // 見開き
  for (let i = 1; i < pages.length; i += 2) {
    const pair = pages.slice(i, i + 2);
    viewer.appendChild(createSpread(pair, pageNum));
    pageNum += pair.length;
  }
}

/* =========================
   スプレッド生成
========================= */
function createSpread(pages, pageNum) {
  const spread = document.createElement('div');
  spread.className = 'spread';

  pages.forEach((src) => {
    const page = document.createElement('div');
    page.className = 'page';

    const img = document.createElement('img');
    img.src = src;

    page.appendChild(img);

    // ←
    const left = document.createElement('button');
    left.textContent = '←';
    left.onclick = (e) => {
  e.stopPropagation();

  if (!selectedPage) return;

  const index = getPageIndex(selectedPage);
  movePage(index, -1);
};
    // →
    const right = document.createElement('button');
    right.textContent = '→';
    right.onclick = (e) => {
  e.stopPropagation();

  if (!selectedPage) return;

  const index = getPageIndex(selectedPage);
  movePage(index, 1);
};

    page.appendChild(left);
    page.appendChild(right);

    spread.appendChild(page);

    // 追加ボタン
const addBtn = document.createElement('button');
addBtn.className = 'add-btn';
addBtn.textContent = '+';
addBtn.onclick = (e) => {
  e.stopPropagation();
  const index = getPageIndex(page);
  const pages = getAllPages();
  pages.splice(index + 1, 0, pages[index]); // 複製
  rebuildFromPages(pages);
};

// 削除ボタン
const delBtn = document.createElement('button');
delBtn.className = 'delete-btn';
delBtn.textContent = '×';
delBtn.onclick = (e) => {
  e.stopPropagation();
  const index = getPageIndex(page);
  const pages = getAllPages();
  pages.splice(index, 1);
  rebuildFromPages(pages);
};

page.appendChild(addBtn);
page.appendChild(delBtn);

left.className = 'move-left-btn';
right.className = 'move-right-btn';

page.onclick = () => {

  // ソートモードじゃなければ何もしない
  if (!isSortMode) return;

  if (selectedPage === page) {
  page.classList.remove('selected');
  selectedPage = null;
  return;
  }

  // 前の選択解除
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('selected');
  });

  // 新しく選択
  page.classList.add('selected');
  selectedPage = page;
};

  });


  // ページ番号
  const label = document.createElement('div');
  label.className = 'pageNumber';
  label.textContent = pages.length === 2
    ? `${pageNum}-${pageNum + 1}`
    : `${pageNum}`;
  spread.appendChild(label);

  return spread;
}

/* =========================
   ページ取得
========================= */
function getAllPages() {
  return Array.from(document.querySelectorAll('.page img'))
    .map(img => img.src);
}

/* =========================
   ページ移動
========================= */
function movePage(index, direction) {
  const pages = getAllPages();

  const target = index + direction;
  if (target < 0 || target >= pages.length) return;

  [pages[index], pages[target]] = [pages[target], pages[index]];

  rebuildFromPages(pages);

  // 再選択
setTimeout(() => {
  const pages = document.querySelectorAll('.page');
  if (pages[index + direction]) {
    pages[index + direction].classList.add('selected');
    selectedPage = pages[index + direction];
  }
}, 0);
}
/* =========================
   index取得
========================= */
function getPageIndex(targetPage) {
  return Array.from(document.querySelectorAll('.page')).indexOf(targetPage);
}

/* =========================
   並び替えモード
========================= */
function toggleSortMode() {
  isSortMode = !isSortMode;
  document.body.classList.toggle('sort-mode', isSortMode);
  sortBtn.textContent = isSortMode ? '並び替え終了' : '並び替え';
}

/* =========================
   綴じ方向
========================= */
function toggleBinding() {
  isRightBinding = !isRightBinding;
  viewer.classList.toggle('rtl', isRightBinding);
  bindingBtn.textContent = isRightBinding ? '右綴じ' : '左綴じ';
}

/* =========================
   テーマ（ライト切替）
========================= */
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'light') {
  document.body.classList.add('light');
  themeBtn.textContent = 'ダークモード';
} else {
  themeBtn.textContent = 'ライトモード';
}

themeBtn.onclick = () => {
  const isLight = document.body.classList.toggle('light');

  localStorage.setItem('theme', isLight ? 'light' : 'dark');

  themeBtn.textContent = isLight
    ? 'ダークモード'
    : 'ライトモード';
};
/* =========================
   ボタン紐付け
========================= */
bindingBtn.onclick = toggleBinding;

window.addEventListener('DOMContentLoaded', () => {

  sortBtn.addEventListener('click', () => {

    isSortMode = !isSortMode;
    document.body.classList.toggle('sort-mode', isSortMode);

    sortBtn.textContent = isSortMode
      ? '並び替え終了'
      : '並び替え';
  });

});

function toggleUI() {
  document.getElementById('uiBar').classList.toggle('hiddenUI');
  document.querySelector('.header').classList.toggle('hiddenUI');
}


