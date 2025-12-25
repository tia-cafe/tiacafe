const fs = require('fs');
const path = require('path');

// خواندن داده‌های JSON
const contentPath = path.join(__dirname, '../data/content.json');
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

// خواندن تمپلیت‌ها
const indexTemplate = fs.readFileSync(path.join(__dirname, '../templates/index.template.html'), 'utf8');
const menuTemplate = fs.readFileSync(path.join(__dirname, '../templates/menu.template.html'), 'utf8');

// تولید صفحه اصلی
function generateIndex() {
  let html = indexTemplate;
  console.log(content.homepage.heroImg);
  html = html.replace('{{HERO_IMG}}', content.homepage.heroImg);
  html = html.replace('{{LOCATION}}', content.homepage.location);
  html = html.replace('{{INSTAGRAM}}', content.homepage.instagram);
  
  return html;
}

// تولید منوی آیتم‌ها
function generateMenuItems(category) {
  let itemsHTML = '';
  
  category.items.forEach((item, index) => {
    const isLast = index === category.items.length - 1;
    const cardClass = isLast ? 'card card-last' : 'card';
    
    if (item.price1 || item.price2) {
      // آیتم با قیمت
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
                  <span class="price-label">تک شات</span>
                  <span class="price-value">${item.price1}</span>
                </div>
                ` : ''}
                ${item.price2 ? `
                <div class="price-col">
                  <span class="price-label">دو شات</span>
                  <span class="price-value">${item.price2}</span>
                </div>
                ` : ''}
              </div>
              ` : ''}
            </div>
          </div>
          ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
        </div>
      `;
    } else {
      // آیتم بدون قیمت (ساده)
      itemsHTML += `
        <div class="${cardClass}">
          <div class="card-main">
            <div class="card-img"><img src="${item.img}" alt="${item.nameEN}"></div>
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

// تولید صفحه منو
function generateMenu() {
  let html = menuTemplate;
  
  // تولید تب‌ها
  let tabsHTML = '';
  content.menu.categories.forEach((cat, index) => {
    const activeClass = index === 0 ? 'active' : '';
    tabsHTML += `
      <div class="tab-item ${activeClass}" data-target="${cat.id}">
        <span>${cat.nameFA}</span>
      </div>
    `;
  });
  
  // تولید محتوای دسته‌بندی‌ها
  let categoriesHTML = '';
  content.menu.categories.forEach(cat => {
    categoriesHTML += `
      <div class="${cat.id}">
        <div class="menu-item">
          <span>${cat.nameFA}</span>
        </div>
        ${generateMenuItems(cat)}
      </div>
    `;
  });
  
  html = html.replace('{{TABS}}', tabsHTML);
  html = html.replace('{{CATEGORIES}}', categoriesHTML);
  
  return html;
}

// ایجاد پوشه خروجی
const distPath = path.join(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// کپی کردن فایل‌های استاتیک (تصاویر، فونت‌ها و غیره)
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

// کپی فایل‌های استاتیک
['img', 'fonts'].forEach(dir => {
  const srcDir = path.join(__dirname, `../${dir}`);
  const destDir = path.join(distPath, dir);
  copyDir(srcDir, destDir);
});

// نوشتن فایل‌های HTML
fs.writeFileSync(path.join(distPath, 'index.html'), generateIndex());
fs.writeFileSync(path.join(distPath, 'menu.html'), generateMenu());

console.log('✅ فایل‌های HTML با موفقیت تولید شدند!');
