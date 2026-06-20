const fs = require('fs');
const path = require('path');

const contentPath = path.join(__dirname, '../data/content.json');
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

const indexTemplate = fs.readFileSync(path.join(__dirname, '../templates/index.template.html'), 'utf8');
const menuTemplate = fs.readFileSync(path.join(__dirname, '../templates/menu.template.html'), 'utf8');

function getSvgFromFile(svgPath) {
  const imagePath = path.join(__dirname, '..' + svgPath);
  const imageContent = fs.readFileSync(imagePath, 'utf8');
  return imageContent;
}

// Match PHP htmlspecialchars() — escape user content before injecting into HTML.
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Match PHP hidden check (handles boolean true and string "true").
function isHidden(flag) {
  return flag === true || flag === 'true';
}

function generateIndex() {
  let html = indexTemplate;
  if (content.homepage.heroImg.match(/vid_/)) {
    html = html.replace('{{HERO_IMG}}', `<video class="hero-vid" autoplay muted loop playsinline><source src="${esc(content.homepage.heroImg)}" type="video/mp4"></video>`);
  } else {
    html = html.replace('{{HERO_IMG}}', `<img src="${esc(content.homepage.heroImg)}" alt="Tia Cafe Interior" class="hero-img" />`);
  }
  html = html.replace('{{LOCATION}}', esc(content.homepage.location));
  html = html.replace('{{INSTAGRAM}}', esc(content.homepage.instagram));

  return html;
}

function generateMenuItems(category) {
  let itemsHTML = '';

  // Match PHP: skip hidden items, and base card-last on the visible list.
  const visibleItems = category.items.filter(item => !isHidden(item.hidden));

  visibleItems.forEach((item, index) => {
    const isLast = index === visibleItems.length - 1;
    const cardClass = isLast ? `card ${category.id} card-last` : `card ${category.id}`;
    const price1 = item.price1 ? String(item.price1).trim() : '';
    const price2 = item.price2 ? String(item.price2).trim() : '';

    if (price1 || price2) {
      itemsHTML += `
        <div class="${cardClass}">
          <div class="card-main">
            <div class="card-img">
              <img style="width: 56px !important; height: 56px !important" src="${esc(item.img)}" alt="${esc(item.nameEN)}">
            </div>
            <div class="card-info">
              <div class="item-title">${esc(item.nameFA)}</div>
              <div class="item-subtitle">${esc(item.nameEN)}</div>
              <div class="price-row">
                ${price1 ? `
                <div class="price-col">
                  <span class="price-label">قیمت</span>
                  <span class="price-value">${esc(price1)}</span>
                </div>
                ` : ''}
                ${price2 ? `
                <div class="price-col">
                  <span class="price-label">قیمت ۲</span>
                  <span class="price-value">${esc(price2)}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          ${item.description ? `<div class="item-desc">${esc(item.description).replace(/\n/g, "<br/>")}</div>` : ''}
        </div>
      `;
    } else {
      itemsHTML += `
        <div class="${cardClass}">
          <div class="card-main">
            <div class="card-img">
              <img style="width: 56px !important; height: 56px !important" src="${esc(item.img)}" alt="${esc(item.nameEN)}">
            </div>
            <div class="card-info">
              <div class="item-title">${esc(item.nameFA)}</div>
              <div class="item-subtitle">${esc(item.nameEN)}</div>
            </div>
          </div>
        </div>
      `;
    }
  });

  return itemsHTML;
}

function generateMenu() {
  let html = menuTemplate;

  let tabsHTML = '';
  content.menu.categories.forEach((cat, index) => {
    if (!isHidden(cat.hidden)) {
      const activeClass = index === 0 ? 'active' : '';
      const lastClass = index === content.menu.categories.length - 1 ? 'tab-item-last' : '';
      tabsHTML += `
    <div class="tab-item ${activeClass} ${lastClass}" data-target="${cat.id}">
      ${/.svg/.test(cat.icon) ? getSvgFromFile(cat.icon) : `<img src="${esc(cat.icon)}" alt="icon" />`}
      <span>${esc(cat.nameFA)}</span>
      </div>
    `;
    }
  });

  let categoriesHTML = '';
  content.menu.categories.forEach(cat => {
    if (!isHidden(cat.hidden)) {
      categoriesHTML += `
      <div class="${cat.id}">
        <div class="menu-item ${cat.id}">
          ${/.svg/.test(cat.icon) ? getSvgFromFile(cat.icon) : `<img src="${esc(cat.icon)}" alt="icon" />`}
          <span>${esc(cat.nameFA)}</span>
        </div>
        ${generateMenuItems(cat)}
      </div>
    `;
    }
  });

  let categoriesArray = [];
  content.menu.categories.forEach(cat => {
    if (!isHidden(cat.hidden)) {
      categoriesArray.push(cat.id);
    }
  });

  html = html.replace('{{TABS}}', tabsHTML);
  html = html.replace('{{CATEGORIES}}', categoriesHTML);
  html = html.replace(/{{CATEGORIESJS}}/g, JSON.stringify(categoriesArray));

  return html;
}

const distPath = path.join(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

const copyDir = (src, dest) => {
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
};

['img', 'fonts'].forEach(dir => {
  const srcDir = path.join(__dirname, `../${dir}`);
  const destDir = path.join(distPath, dir);
  copyDir(srcDir, destDir);
});

{
  const srcDir = path.join(__dirname, "../public");
  copyDir(srcDir, distPath);
};

fs.writeFileSync(path.join(distPath, 'index.html'), generateIndex());
fs.writeFileSync(path.join(distPath, 'menu.html'), generateMenu());

console.log('HTML files successfully generated.');
