const viewer = document.getElementById('viewer');
const fileInput = document.getElementById('fileInput');
const sortBtn = document.getElementById('sortBtn');
const bindingBtn = document.getElementById('bindingToggle');
const themeBtn = document.getElementById('themeToggle');
const controls = document.getElementById('controls');

let isSortMode = false;
let isRightBinding = true;
let uiVisible = true;
let dragged = null;
let isRTL = false;
let scale = 1;
let startDist = 0;
let currentSpread = null;


/* 自然順ソート（重要） */
function naturalSort(a, b) {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

/* 読み込み */
fileInput.addEventListener('change', (e) => {
  let files = Array.from(e.target.files);
  files.sort(naturalSort);

  viewer.innerHTML = '';

  let pageNum = 1;
  let index = 0;

  // 表紙
  if (files.length > 0) {
    const spread = document.createElement('div');
    spread.className = 'spread';

    const page = createPage(files[0]);
    spread.appendChild(page);

    // ページ番号
    addSpreadNumber(spread, `${pageNum}`);

    viewer.appendChild(spread);

    pageNum++;
    index = 1;
  }

  // 見開き
  for (let i = index; i < files.length; i += 2) {
    const spread = document.createElement('div');
    spread.className = 'spread';

    const page1 = createPage(files[i]);
    spread.appendChild(page1);

    const gutter = document.createElement('div');
    gutter.className = 'gutter';
    spread.appendChild(gutter);

    if (files[i + 1]) {
      const page2 = createPage(files[i + 1]);
      spread.appendChild(page2);

      addSpreadNumber(spread, `${pageNum}-${pageNum + 1}`);
      pageNum += 2;
    } else {
      addSpreadNumber(spread, `${pageNum}`);
      pageNum++;
    }

    viewer.appendChild(spread);
  }

  updateCenter();
});

/* ページ生成 */
function createPage(file) {
  const page = document.createElement('div');
  page.className = 'page';

  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);

  page.appendChild(img);
  return page;
}

/* 中央強調 */
function updateCenter() {
  const spreads = document.querySelectorAll('.spread');
  spreads.forEach(s => s.classList.remove('active'));

  let closest = null;
  let min = Infinity;

  spreads.forEach(s => {
    const rect = s.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(window.innerWidth / 2 - center);

    if (dist < min) {
      min = dist;
      closest = s;
    }
  });

  if (closest) closest.classList.add('active');
}

viewer.addEventListener('scroll', () => {
  requestAnimationFrame(updateCenter);
});

/* テーマ */
function toggleTheme() {
  document.body.classList.toggle('light');
}

/* UI */
function toggleUI() {
  uiVisible = !uiVisible;
  document.querySelector('.header').classList.toggle('hiddenUI');
  document.getElementById('uiBar').classList.toggle('hiddenUI');
}

/* 綴じ方向 */
function toggleBinding() {
  isRTL = !isRTL;
  viewer.classList.toggle('rtl');

  // スクロール位置を逆に補正
  viewer.scrollLeft = viewer.scrollWidth;

  const btn = document.getElementById('bindingBtn');
  btn.textContent = isRTL ? '右綴じ' : '左綴じ';

  render(); // ←再描画が必須
}

/* タップでUI */
viewer.addEventListener('click', (e) => {
  // ボタン操作は無視
  if (e.target.closest('.btn')) return;
  if (e.target.closest('button')) return;

  toggleUI();
});

function addSpreadNumber(spread, text) {
  const num = document.createElement('div');
  num.className = 'spreadNumber';
  num.textContent = text;
  num.style.opacity = '0.3';
  spread.appendChild(num);
}
function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

viewer.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    currentSpread = e.target.closest('.spread');
    if (!currentSpread) return;

    startDist = getDistance(e.touches);
  }
}, { passive: false });

viewer.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && currentSpread) {
    e.preventDefault();

    const newDist = getDistance(e.touches);
    let newScale = scale * (newDist / startDist);

    // 制限
    newScale = Math.max(1, Math.min(newScale, 3));

    currentSpread.style.transform = `scale(${newScale})`;

    // スクロール止める
    viewer.style.overflowX = 'hidden';
  }
}, { passive: false });

viewer.addEventListener('touchend', () => {
  scale = Math.max(1, scale);
  startDist = 0;

  // 戻す
  viewer.style.overflowX = 'auto';
});
// 画像読み込み
fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  viewer.innerHTML = '';
  createSpreads(files);
});

document.addEventListener('click', (e) => {
  // UI内クリックは無視
  if (e.target.closest('#ui')) return;

  // ボタン操作も無視
  if (e.target.closest('.btn')) return;

  document.body.classList.toggle('hide-ui');
});

// テーマ切替
themeBtn.onclick = (e) => {
  e.stopPropagation();
  document.body.classList.toggle('dark');
};
/* ===== 並び替えモード ===== */
function toggleSortMode() {
  isSortMode = !isSortMode;

  const btn = document.getElementById('sortBtn');

  // ボタン表示切替
  btn.textContent = isSortMode ? '並び替え終了' : '並び替え';

  // クラス切替（CSSで制御）
  document.body.classList.toggle('sort-mode', isSortMode);
};

// 見開きスプレッド作成
function createSpreads(files) {
  let pageNum = 1;

  if (files[0]) viewer.appendChild(createSpread([files[0]], pageNum++));

  for (let i = 1; i < files.length; i += 2) {
    const pair = [files[i], files[i + 1]].filter(Boolean);
    viewer.appendChild(createSpread(pair, pageNum));
    pageNum += pair.length;
  }

  applyBinding();
}

// スプレッド作成
function createSpread(pages, pageNum) {
  const spread = document.createElement('div');
  spread.className = 'spread';

  pages.forEach(file => {
    const page = document.createElement('div');
    page.className = 'page';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    page.appendChild(img);
    spread.appendChild(page);
  });

  const label = document.createElement('div');
  label.className = 'page-number';
  label.textContent = pages.length === 2 ? `${pageNum}-${pageNum+1}` : `${pageNum}`;
  spread.appendChild(label);

  // 削除ボタン
  const del = document.createElement('button');
  del.className = 'delete-btn';
  del.textContent = '×';
  del.onclick = (e) => {
    e.stopPropagation();
    spread.remove();
    updatePageNumbers();
  };
  spread.appendChild(del);

  // 追加ボタン
  const add = document.createElement('button');
  add.className = 'add-btn';
  add.textContent = '+';
  add.onclick = (e) => {
    e.stopPropagation();
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.multiple = true;
    tempInput.accept = 'image/*';
    tempInput.addEventListener('change', (ev) => {
      const newFiles = Array.from(ev.target.files);
      newFiles.forEach(file => {
        const page = document.createElement('div');
        page.className = 'page';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        page.appendChild(img);
        if (isRightBinding) spread.insertBefore(page, spread.firstChild);
        else spread.appendChild(page);
      });
      updatePageNumbers();
    });
    tempInput.click();
  };
  spread.appendChild(add);

  enableDrag(spread);
  return spread;
}

// 並び替えドラッグ
function enableDrag(spread) {
  spread.draggable = true;

  spread.addEventListener('dragstart', (e) => {
    if (!isSortMode) return e.preventDefault();
    dragged = spread;
  });

  spread.addEventListener('dragover', (e) => e.preventDefault());

  spread.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dragged && dragged !== spread) {
      spread.before(dragged);
      updatePageNumbers();
    }
  });
}
