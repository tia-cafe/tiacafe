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

function generateIndex() {
  let html = indexTemplate;
  if (content.homepage.heroImg.match(/vid_/)) {
    html = html.replace('{{HERO_IMG}}', `<video src="${content.homepage.heroImg}" alt="Tia Cafe Interior" class="hero-img" autoplay loop muted></video>`);
  } else {
    html = html.replace('{{HERO_IMG}}', `<img src="${content.homepage.heroImg}" alt="Tia Cafe Interior" class="hero-img" />`);
  }
  html = html.replace('{{LOCATION}}', content.homepage.location);
  html = html.replace('{{INSTAGRAM}}', content.homepage.instagram);

  return html;
}

function generateMenuItems(category) {
  let itemsHTML = '';

  category.items.forEach((item, index) => {
    const isLast = index === category.items.length - 1;
    const cardClass = isLast ? 'card card-last' : 'card';

    if (item.price1 || item.price2) {
      itemsHTML += `
        <div class="${cardClass}">
          <div class="card-main">
            <div class="card-img">
              <img style="width: 56px !important; height: 56px !important" src="${item.img}" alt="${item.nameEN}">
            </div>
            <div class="card-info">
              <div class="item-title">${item.nameFA}</div>
              <div class="item-subtitle">${item.nameEN}</div>
              ${(item.price1 || item.price2) ? `
              <div class="price-row">
                ${item.price1 ? `
                <div class="price-col">
                  <span class="price-value">${item.price1}</span>
                </div>
                ` : ''}
                ${item.price2 ? `
                <div class="price-col">
                  <span class="price-value">${item.price2}</span>
                </div>
                ` : ''}
              </div>
              ` : ''}
            </div>
          </div>
          ${item.description ? `<div class="item-desc">${item.description.replace(/\n/g, "<br/>")}</div>` : ''}
        </div>
      `;
    } else {
      itemsHTML += `
        <div class="${cardClass}">
          <div class="card-main">
            <div class="card-img">
              <img style="width: 56px !important; height: 56px !important" src="${item.img}" alt="${item.nameEN}">
            </div>
            <div class="card-info">
              <div class="item-title">${item.nameFA}</div>
              <div class="item-subtitle">${item.nameEN}</div>
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
    if (cat.hidden != "true") {
      const activeClass = index === 0 ? 'active' : '';
      const lastClass = index === content.menu.categories.length - 1 ? 'tab-item-last' : '';
      tabsHTML += `
    <div class="tab-item ${activeClass} ${lastClass}" data-target="${cat.id}">
      ${getSvgFromFile(cat.icon)}
      <span>${cat.nameFA}</span>
      </div>
    `;
    }
  });

  let categoriesHTML = '';
  content.menu.categories.forEach(cat => {
    if (cat.hidden != "true") {
      categoriesHTML += `
      <div class="${cat.id}">
        <div class="menu-item">
          ${getSvgFromFile(cat.icon)}
          <span>${cat.nameFA}</span>
        </div>
        ${generateMenuItems(cat)}
      </div>
    `;
    }
  });

  let categoriesArray = [];
  content.menu.categories.forEach(cat => {
    if (cat.hidden != "true") {
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

fs.writeFileSync(path.join(distPath, 'index.html'), generateIndex());
fs.writeFileSync(path.join(distPath, 'menu.html'), generateMenu());

console.log('HTML files successfully generated.');
