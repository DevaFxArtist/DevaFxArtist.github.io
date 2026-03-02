const STORAGE_KEY = 'portfolio-glass-data-v2';
const AUTH_KEY = 'portfolio-admin-auth';
// Password: deva-owner-2026
const OWNER_HASH = '095ab38a81c5d9507be339d817c77ecb89e7a461cfa5e7f145f281b6d44ad410';

const FALLBACK_DATA = {
  profile: {
    name: 'Deva Bhuvaneswaran',
    about:
      'This is Deva, a passionate artist committed to continuously improving craft and creating high-quality visual effects.',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    nameFontSize: 2.2,
    nameLetterSpacing: 0.06,
    aboutWidth: 58
  },
  ctas: [
    ctaItem('Showreel', 'https://www.youtube.com/', 'large', true, 'rgba(230,220,166,0.28)'),
    ctaItem('R&D Works', '#', 'medium', false, 'rgba(152,208,183,0.22)')
  ],
  icons: [
    iconItem('in', 'https://linkedin.com'),
    iconItem('▶', 'https://youtube.com'),
    iconItem('A', 'https://www.artstation.com'),
    iconItem('G', 'https://github.com')
  ],
  contacts: [contactItem('email', 'devafx.houdini@gmail.com'), contactItem('phone', '9843626604')],
  photographyTitle: 'Photography',
  photos: [
    photoItem('large'),
    photoItem('medium'),
    photoItem('tall'),
    photoItem('small'),
    photoItem('large'),
    photoItem('small'),
    photoItem('medium'),
    photoItem('small')
  ],
  global: {
    fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
    radius: 18,
    glassOpacity: 0.12,
    blur: 20,
    spacing: 1,
    gridGap: 1
  }
};

function stylePreset(background = 'rgba(255,255,255,0.12)', text = '#edf0f7') {
  return {
    background,
    text,
    border: 'rgba(255,255,255,0.2)',
    opacity: 0.12,
    blur: 20,
    glow: 'rgba(130, 165, 255, 0.35)',
    radius: 18,
    padding: 1
  };
}
function ctaItem(text, href, size, newTab, bg) {
  return { id: crypto.randomUUID(), text, href, size, newTab, style: stylePreset(bg, '#f4f7ff') };
}
function iconItem(label, href) {
  return {
    id: crypto.randomUUID(),
    label,
    href,
    tooltip: label,
    iconImage: '',
    size: 1,
    newTab: true,
    hover: true,
    style: stylePreset('rgba(93,122,255,0.32)', '#ffffff')
  };
}
function contactItem(type, value) {
  return {
    id: crypto.randomUUID(),
    type,
    value,
    showIcon: true,
    copyEnabled: true,
    style: stylePreset('rgba(198,193,154,0.22)', '#f5f6fd')
  };
}
function photoItem(size) {
  return {
    id: crypto.randomUUID(),
    image: `https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/900/600`,
    caption: 'Untitled frame',
    size,
    showCaption: false,
    lightbox: true,
    externalLink: ''
  };
}

const state = { data: null, admin: localStorage.getItem(AUTH_KEY) === 'true' };
const app = document.getElementById('app');
const adminPanel = document.getElementById('adminPanel');
const adminControls = document.getElementById('adminControls');
const adminBtn = document.getElementById('adminAccessBtn');
const authDialog = document.getElementById('authDialog');
const authForm = document.getElementById('authForm');
const authError = document.getElementById('authError');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const dynamicStyles = document.createElement('style');
document.head.appendChild(dynamicStyles);

document.getElementById('closeLightbox').addEventListener('click', () => lightbox.close());
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('resetBtn').addEventListener('click', resetDefaults);
document.getElementById('exportBtn').addEventListener('click', exportData);
adminBtn.addEventListener('click', () => (state.admin ? toggleAdminPanel() : authDialog.showModal()));
authForm.addEventListener('submit', (event) => {
  event.preventDefault();
  attemptLogin(new FormData(authForm).get('password'));
});
init();

async function init() {
  state.data = await hydrateData();
  render();
}

async function hydrateData() {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsedLocal = JSON.parse(local);
      if (isValidDataShape(parsedLocal)) return parsedLocal;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  try {
    const remote = await fetch('data.json');
    if (remote.ok) {
      const parsedRemote = await remote.json();
      if (isValidDataShape(parsedRemote)) return parsedRemote;
    }
  } catch {}

  return structuredClone(FALLBACK_DATA);
}

function isValidDataShape(data) {
  return Boolean(
    data &&
      typeof data === 'object' &&
      data.profile &&
      data.global &&
      Array.isArray(data.ctas) &&
      Array.isArray(data.icons) &&
      Array.isArray(data.contacts) &&
      Array.isArray(data.photos)
  );
}

function render() {
  applyGlobalVars();
  renderPublicView();
  adminPanel.classList.toggle('hidden', !state.admin);
  adminBtn.textContent = state.admin ? 'Toggle Admin Panel' : 'Owner Edit Mode';
  if (state.admin) renderAdminControls();
}

function applyGlobalVars() {
  const g = state.data.global;
  const root = document.documentElement;
  root.style.setProperty('--font-family', g.fontFamily);
  root.style.setProperty('--radius-global', `${g.radius}px`);
  root.style.setProperty('--glass-opacity', g.glassOpacity);
  root.style.setProperty('--glass-blur', `${g.blur}px`);
  root.style.setProperty('--spacing', `${g.spacing}rem`);
  root.style.setProperty('--grid-gap', `${g.gridGap}rem`);
}

function renderPublicView() {
  const d = state.data;
  dynamicStyles.textContent = buildDynamicCss();
  app.innerHTML = `
  <section class="profile-card">
    <div class="profile-image-wrap"><img src="${d.profile.image}" alt="Profile portrait" /></div>
    <div class="profile-copy">
      <h1>${escapeHtml(d.profile.name)}</h1>
      <p>${escapeHtml(d.profile.about)}</p>
    </div>
  </section>

  <div class="divider"></div>

  <section class="showreel-layout">
    <div class="showreel-cta">
      ${d.ctas
        .map(
          (cta, i) =>
            `<a class="glass-button style-cta-${i}" data-size="${cta.size}" href="${cta.href}" ${
              cta.newTab ? 'target="_blank" rel="noreferrer"' : ''
            }>${escapeHtml(cta.text)}</a>`
        )
        .join('')}
    </div>

    <aside class="showreel-side">
      <div class="icons-grid">
        ${d.icons
          .map(
            (icon, i) => `<a title="${escapeHtml(icon.tooltip)}" class="icon-link style-icon-${i} ${
              icon.hover ? '' : 'no-hover'
            }" href="${icon.href}" ${icon.newTab ? 'target="_blank" rel="noreferrer"' : ''}>
              ${icon.iconImage ? `<img src="${icon.iconImage}" alt="${escapeHtml(icon.tooltip)}" />` : `<span>${escapeHtml(icon.label)}</span>`}
            </a>`
          )
          .join('')}
      </div>

      <div class="contact-stack">
        ${d.contacts.map((c, i) => renderContact(c, i)).join('')}
      </div>
    </aside>
  </section>

  <div class="divider"></div>

  <section>
    <header class="section-header">
      <span class="glass-chip">${escapeHtml(d.photographyTitle)}</span>
    </header>
    <div class="photo-grid">
      ${d.photos.map(renderPhotoCard).join('')}
    </div>
  </section>
  `;

  app.querySelectorAll('[data-copy]').forEach((el) => {
    el.addEventListener('click', async (e) => {
      await navigator.clipboard.writeText(e.currentTarget.dataset.copy);
      e.currentTarget.querySelector('.copy-chip').textContent = 'Copied';
      setTimeout(() => (e.currentTarget.querySelector('.copy-chip').textContent = 'Copy'), 1000);
    });
  });

  app.querySelectorAll('.photo-card[data-photo-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const photo = state.data.photos.find((x) => x.id === e.currentTarget.dataset.photoId);
      if (!photo) return;
      if (photo.externalLink) return window.open(photo.externalLink, '_blank', 'noreferrer');
      if (photo.lightbox) {
        lightboxImage.src = photo.image;
        lightboxCaption.textContent = photo.caption;
        lightbox.showModal();
      }
    });
  });
}

function buildDynamicCss() {
  const d = state.data;
  const profileVars = `.profile-copy{--name-font-size:${d.profile.nameFontSize}rem;--name-letter-spacing:${d.profile.nameLetterSpacing}em;--about-width:${d.profile.aboutWidth}ch;}`;
  const ctaCss = d.ctas.map((x, i) => styleRule(`.style-cta-${i}`, x.style, true)).join('');
  const iconCss = d.icons
    .map((x, i) => `${styleRule(`.style-icon-${i}`, x.style)}.style-icon-${i}{transform:scale(${x.size});}`)
    .join('');
  const contactCss = d.contacts.map((x, i) => styleRule(`.style-contact-${i}`, x.style)).join('');
  return `${profileVars}${ctaCss}${iconCss}${contactCss}`;
}

function styleRule(selector, style, includePadding = false) {
  return `${selector}{--glow:${style.glow};color:${style.text};border-color:${style.border};background:linear-gradient(140deg,rgba(255,255,255,0.22),rgba(255,255,255,0.03)),${style.background};--glass-opacity:${style.opacity};--glass-blur:${style.blur}px;border-radius:${style.radius}px;${
    includePadding ? `padding:${style.padding}rem;` : ''
  }}`;
}

function renderContact(contact, index) {
  const icon = contact.type === 'email' ? '✉' : '☎';
  const href = contact.type === 'email' ? `mailto:${contact.value}` : `tel:${contact.value.replace(/\s+/g, '')}`;
  const copy = contact.copyEnabled ? `data-copy="${escapeHtml(contact.value)}"` : '';
  const chip = contact.copyEnabled ? '<span class="copy-chip">Copy</span>' : '';
  return `<a class="contact-card style-contact-${index}" href="${href}" ${copy}>
    ${contact.showIcon ? `<span>${icon}</span>` : ''}
    <span>${escapeHtml(contact.value)}</span>
    ${chip}
  </a>`;
}

function renderPhotoCard(photo) {
  const caption = photo.showCaption ? `<figcaption>${escapeHtml(photo.caption)}</figcaption>` : '';
  return `<figure class="photo-card" data-card-size="${photo.size}" data-photo-id="${photo.id}" role="button" tabindex="0">
    <img src="${photo.image}" alt="${escapeHtml(photo.caption)}" />
    ${caption}
  </figure>`;
}

function renderAdminControls() {
  const d = state.data;
  adminControls.innerHTML = `
    <fieldset>
      <legend>Global Theme</legend>
      ${controlInput('Font Family', 'global.fontFamily', d.global.fontFamily)}
      ${controlRange('Border Radius', 'global.radius', d.global.radius, 6, 32, 1)}
      ${controlRange('Glass Opacity', 'global.glassOpacity', d.global.glassOpacity, 0.04, 0.35, 0.01)}
      ${controlRange('Blur Intensity', 'global.blur', d.global.blur, 8, 40, 1)}
      ${controlRange('Layout Spacing', 'global.spacing', d.global.spacing, 0.5, 2.2, 0.1)}
      ${controlRange('Grid Gap', 'global.gridGap', d.global.gridGap, 0.4, 2.5, 0.1)}
    </fieldset>
    <fieldset>
      <legend>Profile Section</legend>
      ${controlInput('Name', 'profile.name', d.profile.name)}
      ${controlTextarea('About', 'profile.about', d.profile.about)}
      ${controlUpload('Profile Image', 'profile.image')}
      ${controlRange('Name Font Size', 'profile.nameFontSize', d.profile.nameFontSize, 1.2, 3.2, 0.1)}
      ${controlRange('Letter Spacing', 'profile.nameLetterSpacing', d.profile.nameLetterSpacing, 0, 0.2, 0.01)}
      ${controlRange('About Width', 'profile.aboutWidth', d.profile.aboutWidth, 30, 72, 1)}
    </fieldset>
    <fieldset><legend>Showreel Buttons</legend>${d.ctas.map((cta, i) => buttonEditor(cta, `ctas.${i}`)).join('')}</fieldset>
    <fieldset><legend>Icon Grid</legend>${d.icons.map((icon, i) => iconEditor(icon, i)).join('')}<button class="glass-button" data-action="add-icon">Add Icon</button></fieldset>
    <fieldset><legend>Contacts</legend>${d.contacts.map((contact, i) => contactEditor(contact, i)).join('')}</fieldset>
    <fieldset><legend>Photography Grid</legend>${controlInput('Section Title', 'photographyTitle', d.photographyTitle)}${d.photos
      .map((photo, i) => photoEditor(photo, i))
      .join('')}<button class="glass-button" data-action="add-photo">Add Photo</button></fieldset>
  `;

  adminControls.querySelectorAll('input,select,textarea').forEach((field) => {
    field.addEventListener('input', handleFieldUpdate);
    field.addEventListener('change', handleFieldUpdate);
  });
  adminControls.querySelectorAll('button[data-action]').forEach((btn) => btn.addEventListener('click', handleAction));
}

function buttonEditor(item, path) {
  return `<div class="editor-item">${controlInput('Text', `${path}.text`, item.text)}${controlInput('URL', `${path}.href`, item.href)}${controlSelect(
    'Size',
    `${path}.size`,
    item.size,
    ['large', 'medium']
  )}${controlCheckbox('Open New Tab', `${path}.newTab`, item.newTab)}${styleControls(path, item.style)}</div>`;
}
function iconEditor(icon, index) {
  const path = `icons.${index}`;
  return `<div class="editor-item">${controlInput('Label', `${path}.label`, icon.label)}${controlInput('URL', `${path}.href`, icon.href)}${controlInput(
    'Tooltip',
    `${path}.tooltip`,
    icon.tooltip
  )}${controlUpload('Upload Icon', `${path}.iconImage`)}${controlRange('Icon Scale', `${path}.size`, icon.size, 0.7, 1.4, 0.05)}${controlCheckbox(
    'Hover Animation',
    `${path}.hover`,
    icon.hover
  )}${controlCheckbox('Open New Tab', `${path}.newTab`, icon.newTab)}${styleControls(path, icon.style)}<div class="editor-actions"><button class="glass-button" data-action="move-icon-up" data-index="${index}">Up</button><button class="glass-button" data-action="move-icon-down" data-index="${index}">Down</button><button class="glass-button" data-action="delete-icon" data-index="${index}">Delete</button></div></div>`;
}
function contactEditor(item, index) {
  const path = `contacts.${index}`;
  return `<div class="editor-item">${controlSelect('Type', `${path}.type`, item.type, ['email', 'phone'])}${controlInput('Value', `${path}.value`, item.value)}${controlCheckbox('Show Icon', `${path}.showIcon`, item.showIcon)}${controlCheckbox('Copy Toggle', `${path}.copyEnabled`, item.copyEnabled)}${styleControls(path, item.style)}</div>`;
}
function photoEditor(item, index) {
  const path = `photos.${index}`;
  return `<div class="editor-item">${controlUpload('Upload Image', `${path}.image`)}${controlInput('Caption', `${path}.caption`, item.caption)}${controlSelect(
    'Card Size',
    `${path}.size`,
    item.size,
    ['small', 'medium', 'tall', 'large']
  )}${controlCheckbox('Show Caption', `${path}.showCaption`, item.showCaption)}${controlCheckbox('Lightbox', `${path}.lightbox`, item.lightbox)}${controlInput(
    'External Link (optional)',
    `${path}.externalLink`,
    item.externalLink
  )}<div class="editor-actions"><button class="glass-button" data-action="move-photo-up" data-index="${index}">Up</button><button class="glass-button" data-action="move-photo-down" data-index="${index}">Down</button><button class="glass-button" data-action="delete-photo" data-index="${index}">Delete</button></div></div>`;
}
function styleControls(path, style) {
  return `${controlColor('Background Tint', `${path}.style.background`, style.background)}${controlColor('Text Color', `${path}.style.text`, style.text)}${controlColor(
    'Border Color',
    `${path}.style.border`,
    style.border
  )}${controlColor('Hover Glow', `${path}.style.glow`, style.glow)}${controlRange(
    'Glass Opacity',
    `${path}.style.opacity`,
    style.opacity,
    0.04,
    0.35,
    0.01
  )}${controlRange('Blur Intensity', `${path}.style.blur`, style.blur, 8, 40, 1)}${controlRange('Radius', `${path}.style.radius`, style.radius, 8, 30, 1)}${controlRange('Padding', `${path}.style.padding`, style.padding, 0.4, 2, 0.1)}`;
}

const controlInput = (label, path, value) => `<label class="control">${label}<input data-path="${path}" value="${escapeAttr(value)}" /></label>`;
const controlTextarea = (label, path, value) => `<label class="control">${label}<textarea data-path="${path}">${escapeHtml(value)}</textarea></label>`;
const controlRange = (label, path, value, min, max, step) => `<label class="control">${label}<input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-path="${path}" /><small>${value}</small></label>`;
const controlSelect = (label, path, value, options) => `<label class="control">${label}<select data-path="${path}">${options.map((item) => `<option ${item === value ? 'selected' : ''} value="${item}">${item}</option>`).join('')}</select></label>`;
const controlCheckbox = (label, path, value) => `<label class="control">${label}<input type="checkbox" data-path="${path}" ${value ? 'checked' : ''} /></label>`;
const controlUpload = (label, path) => `<label class="control">${label}<input type="file" accept="image/*" data-path="${path}" /></label>`;
const controlColor = (label, path, value) => `<label class="control">${label}<input data-path="${path}" value="${escapeAttr(value)}" /></label>`;

function handleFieldUpdate(event) {
  const target = event.currentTarget;
  const path = target.dataset.path;
  if (!path) return;

  if (target.type === 'file') {
    const [file] = target.files;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setByPath(state.data, path, reader.result);
      saveAndRender();
    };
    reader.readAsDataURL(file);
    return;
  }

  let value;
  if (target.type === 'checkbox') value = target.checked;
  else if (target.type === 'range') {
    value = Number(target.value);
    const small = target.parentElement.querySelector('small');
    if (small) small.textContent = target.value;
  } else value = target.value;

  setByPath(state.data, path, value);
  saveAndRender(false);
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  const index = Number(event.currentTarget.dataset.index);
  if (action === 'add-icon') state.data.icons.push(iconItem('★', '#'));
  if (action === 'move-icon-up') moveItem(state.data.icons, index, -1);
  if (action === 'move-icon-down') moveItem(state.data.icons, index, 1);
  if (action === 'delete-icon') state.data.icons.splice(index, 1);
  if (action === 'add-photo') state.data.photos.push(photoItem('small'));
  if (action === 'move-photo-up') moveItem(state.data.photos, index, -1);
  if (action === 'move-photo-down') moveItem(state.data.photos, index, 1);
  if (action === 'delete-photo') state.data.photos.splice(index, 1);
  saveAndRender();
}
function moveItem(arr, index, delta) {
  const next = index + delta;
  if (next < 0 || next >= arr.length) return;
  [arr[index], arr[next]] = [arr[next], arr[index]];
}

async function attemptLogin(password) {
  const hash = await sha256(password);
  if (hash !== OWNER_HASH) {
    authError.textContent = 'Incorrect password.';
    return;
  }
  state.admin = true;
  localStorage.setItem(AUTH_KEY, 'true');
  authError.textContent = '';
  authDialog.close();
  render();
}
function logout() {
  state.admin = false;
  localStorage.removeItem(AUTH_KEY);
  adminPanel.classList.add('hidden');
  render();
}
function resetDefaults() {
  state.data = structuredClone(FALLBACK_DATA);
  saveAndRender();
}
function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = 'portfolio-data.json';
  link.click();
  URL.revokeObjectURL(href);
}
function toggleAdminPanel() {
  adminPanel.classList.toggle('hidden');
}
function saveAndRender(withPanel = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  render();
  if (!withPanel) adminPanel.classList.remove('hidden');
}
function setByPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((acc, key) => acc[key], obj);
  target[last] = value;
}
function escapeHtml(input = '') {
  return String(input).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function escapeAttr(input = '') {
  return escapeHtml(input).replaceAll("'", '&#39;');
}
async function sha256(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
