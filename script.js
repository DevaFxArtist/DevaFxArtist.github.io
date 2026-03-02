const OWNER_HASH = '095ab38a81c5d9507be339d817c77ecb89e7a461cfa5e7f145f281b6d44ad410'; // deva-owner-2026

const THEMES = {
  midnight: { '--bg-main': '#1f232b', '--text-main': '#edf0f7' },
  slate: { '--bg-main': '#24262e', '--text-main': '#f2f2f7' },
  aurora: { '--bg-main': '#1e2830', '--text-main': '#f0fbff' }
};

const state = { data: null, admin: false, popoverTarget: null, drag: null };
const app = document.getElementById('app');
const popover = document.getElementById('editPopover');
const adminBtn = document.getElementById('adminAccessBtn');
const themeBtn = document.getElementById('themeBtn');
const exportBtn = document.getElementById('exportBtn');
const logoutBtn = document.getElementById('logoutBtn');

const authDialog = document.getElementById('authDialog');
const authForm = document.getElementById('authForm');
const authError = document.getElementById('authError');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');

document.getElementById('closeLightbox').addEventListener('click', () => lightbox.close());
adminBtn.addEventListener('click', () => authDialog.showModal());
authForm.addEventListener('submit', (e) => { e.preventDefault(); login(new FormData(authForm).get('password')); });
logoutBtn.addEventListener('click', () => { state.admin = false; closePopover(); render(); });
exportBtn.addEventListener('click', exportData);
themeBtn.addEventListener('click', openThemePicker);
document.addEventListener('click', onDocumentClick);
window.addEventListener('resize', closePopover);

init();

async function init() {
  const response = await fetch('data.json');
  state.data = await response.json();
  state.data.global.themePreset ??= 'midnight';
  render();
}

function render() {
  applyTheme();
  document.body.classList.toggle('admin-mode', state.admin);
  themeBtn.classList.toggle('hidden', !state.admin);
  exportBtn.classList.toggle('hidden', !state.admin);
  logoutBtn.classList.toggle('hidden', !state.admin);
  app.innerHTML = `
    <section class="profile-card" data-editable="profile">
      ${editTools('profile')}
      <div class="profile-image-wrap"><img src="${state.data.profile.image}" alt="Profile"/></div>
      <div class="profile-copy"><h1>${esc(state.data.profile.name)}</h1><p>${esc(state.data.profile.about)}</p></div>
    </section>
    <div class="divider"></div>
    <section class="showreel-layout">
      <div class="showreel-cta" data-zone="ctas">${state.data.ctas.map((x,i)=>renderCta(x,i)).join('')}</div>
      <aside class="showreel-side">
        <div class="icons-grid" data-zone="icons">${state.data.icons.map((x,i)=>renderIcon(x,i)).join('')}</div>
        <div class="contact-stack">${state.data.contacts.map(renderContact).join('')}</div>
      </aside>
    </section>
    <div class="divider"></div>
    <section>
      <header class="section-header"><span class="glass-button" data-size="small">${esc(state.data.photographyTitle)}</span></header>
      <div class="photo-grid" data-zone="photos">${state.data.photos.map((x,i)=>renderPhoto(x,i)).join('')}</div>
    </section>
  `;

  bindInteractions();
}

function renderCta(cta, index) {
  return `<a class="glass-button" data-size="${cta.size === 'medium' ? 'medium' : cta.size === 'large' ? 'large' : 'small'}" href="${cta.href}" ${cta.newTab ? 'target="_blank" rel="noreferrer"':''} data-editable="cta" data-index="${index}" draggable="${state.admin}">${editTools('cta', index)}${esc(cta.text)}</a>`;
}
function renderIcon(icon, index) {
  const tint = icon.tint !== false ? 'tint-on' : '';
  return `<a class="icon-link ${tint}" href="${icon.href}" data-editable="icon" data-index="${index}" draggable="${state.admin}" ${icon.newTab ? 'target="_blank" rel="noreferrer"':''}>${editTools('icon', index)}${icon.iconImage ? `<img src="${icon.iconImage}" alt="${esc(icon.label || '')}"/>` : `<span>${esc(icon.label || '•')}</span>`}</a>`;
}
function renderContact(contact) {
  const href = contact.type === 'email' ? `mailto:${contact.value}` : `tel:${contact.value.replace(/\s+/g,'')}`;
  const icon = contact.type === 'email' ? '✉' : '☎';
  return `<a class="contact-card" href="${href}">${contact.showIcon ? `<span>${icon}</span>`:''}<span>${esc(contact.value)}</span>${contact.copyEnabled?'<span class="copy-chip">Copy</span>':''}</a>`;
}
function renderPhoto(photo, index) {
  return `<figure class="photo-card" data-card-size="${normalizePhotoSize(photo.size)}" data-editable="photo" data-index="${index}" data-photo-id="${photo.id}" draggable="${state.admin}">${editTools('photo', index)}<img src="${photo.image}" alt="${esc(photo.caption || '')}"/>${photo.showCaption ? `<figcaption>${esc(photo.caption||'')}</figcaption>`:''}</figure>`;
}
function editTools(type, index='') {
  if (!state.admin) return '';
  return `<span class="edit-tools"><button type="button" class="tool-btn" data-tool="edit" data-type="${type}" data-index="${index}">✎</button><button type="button" class="tool-btn" data-tool="drag" title="Drag">⋮⋮</button><button type="button" class="tool-btn" data-tool="size" data-type="${type}" data-index="${index}">◱</button></span>`;
}

function bindInteractions() {
  app.querySelectorAll('[data-copy]').forEach((el) => el.addEventListener('click', (e) => navigator.clipboard.writeText(e.currentTarget.dataset.copy)));

  app.querySelectorAll('[data-editable]').forEach((el) => {
    if (state.admin) el.addEventListener('click', (e) => openEditor(e, el));
    if (state.admin) setupDrag(el);
    if (el.dataset.editable === 'photo' && !state.admin) {
      el.addEventListener('click', () => {
        const item = state.data.photos[Number(el.dataset.index)];
        if (item.externalLink) return window.open(item.externalLink, '_blank', 'noreferrer');
        if (item.lightbox) {
          lightboxImage.src = item.image;
          lightboxCaption.textContent = item.caption || '';
          lightbox.showModal();
        }
      });
    }
  });
}

function setupDrag(el) {
  if (!['cta','icon','photo'].includes(el.dataset.editable)) return;
  el.addEventListener('dragstart', () => { state.drag = { type: el.dataset.editable, from: Number(el.dataset.index) }; el.classList.add('dragging'); });
  el.addEventListener('dragend', () => { el.classList.remove('dragging'); state.drag = null; });
  el.addEventListener('dragover', (e) => e.preventDefault());
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!state.drag || state.drag.type !== el.dataset.editable) return;
    const to = Number(el.dataset.index);
    reorder(state.drag.type, state.drag.from, to);
  });
}

function reorder(type, from, to) {
  if (from === to) return;
  const map = { cta: 'ctas', icon: 'icons', photo: 'photos' };
  const arr = state.data[map[type]];
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
  render();
}

function openEditor(event, el) {
  if (event.target.closest('[data-tool="drag"]')) return;
  event.preventDefault();
  event.stopPropagation();

  const type = event.target.dataset.type || el.dataset.editable;
  const index = Number(event.target.dataset.index ?? el.dataset.index ?? -1);
  state.popoverTarget = { type, index };

  if (type === 'cta') popover.innerHTML = ctaEditor(index);
  else if (type === 'icon') popover.innerHTML = iconEditor(index);
  else if (type === 'photo') popover.innerHTML = photoEditor(index);
  else if (type === 'profile') popover.innerHTML = profileEditor();

  bindPopoverActions();
  const rect = el.getBoundingClientRect();
  popover.style.top = `${Math.min(window.innerHeight - 260, rect.bottom + 8)}px`;
  popover.style.left = `${Math.max(8, Math.min(window.innerWidth - 330, rect.left))}px`;
  popover.classList.remove('hidden');
}

function ctaEditor(i) {
  const x = state.data.ctas[i];
  return `<div class="row"><label>Title</label><input data-field="text" value="${escAttr(x.text)}"/></div>
  <div class="row"><label>Link</label><input data-field="href" value="${escAttr(x.href)}"/></div>
  <div class="row"><label>Size</label><select data-field="size"><option ${sel(x.size,'small')}>small</option><option ${sel(x.size,'medium')}>medium</option><option ${sel(x.size,'large')}>large</option></select></div>
  <div class="row"><label><input type="checkbox" data-field="newTab" ${x.newTab?'checked':''}/> Open new tab</label></div>
  <div class="actions"><button data-action="save">Save</button><button data-action="duplicate">Duplicate</button><button data-action="delete">Delete</button></div>`;
}
function iconEditor(i) {
  const x = state.data.icons[i];
  return `<div class="row"><label>Label</label><input data-field="label" value="${escAttr(x.label||'')}"/></div>
  <div class="row"><label>Link</label><input data-field="href" value="${escAttr(x.href||'')}"/></div>
  <div class="row"><label>Icon Image</label><input type="file" data-field="iconImage" accept="image/*"/></div>
  <div class="row"><label><input type="checkbox" data-field="tint" ${x.tint!==false?'checked':''}/> Background tint</label></div>
  <div class="actions"><button data-action="save">Save</button><button data-action="delete">Delete</button></div>`;
}
function photoEditor(i) {
  const x = state.data.photos[i];
  return `<div class="row"><label>Caption</label><input data-field="caption" value="${escAttr(x.caption||'')}"/></div>
  <div class="row"><label>Size</label><select data-field="size"><option ${sel(normalizePhotoSize(x.size),'small')}>small</option><option ${sel(normalizePhotoSize(x.size),'wide')}>wide</option><option ${sel(normalizePhotoSize(x.size),'tall')}>tall</option><option ${sel(normalizePhotoSize(x.size),'large')}>large</option></select></div>
  <div class="row"><label>Replace image</label><input type="file" data-field="image" accept="image/*"/></div>
  <div class="row"><label><input type="checkbox" data-field="showCaption" ${x.showCaption?'checked':''}/> Show caption</label></div>
  <div class="row"><label><input type="checkbox" data-field="lightbox" ${x.lightbox?'checked':''}/> Lightbox</label></div>
  <div class="actions"><button data-action="save">Save</button><button data-action="delete">Delete</button></div>`;
}
function profileEditor() {
  const x = state.data.profile;
  return `<div class="row"><label>Name</label><input data-field="name" value="${escAttr(x.name)}"/></div>
  <div class="row"><label>About</label><textarea data-field="about">${esc(x.about)}</textarea></div>
  <div class="row"><label>Profile image</label><input type="file" data-field="image" accept="image/*"/></div>
  <div class="actions"><button data-action="save">Save</button></div>`;
}

function bindPopoverActions() {
  popover.querySelectorAll('button[data-action]').forEach((btn) => btn.addEventListener('click', handlePopoverAction));
}

async function handlePopoverAction(e) {
  const { type, index } = state.popoverTarget || {};
  if (!type) return;
  const action = e.currentTarget.dataset.action;
  const target = type === 'profile' ? state.data.profile : state.data[`${type}s`][index];

  if (action === 'delete' && type !== 'profile') { state.data[`${type}s`].splice(index, 1); closePopover(); render(); return; }
  if (action === 'duplicate' && type === 'cta') { state.data.ctas.splice(index + 1, 0, structuredClone(target)); closePopover(); render(); return; }

  for (const field of popover.querySelectorAll('[data-field]')) {
    const key = field.dataset.field;
    if (field.type === 'file') {
      const file = field.files[0];
      if (!file) continue;
      target[key] = await fileToDataUrl(file);
    } else if (field.type === 'checkbox') target[key] = field.checked;
    else target[key] = field.value;
  }
  closePopover();
  render();
}

function openThemePicker(e) {
  state.popoverTarget = { type: 'theme', index: -1 };
  popover.innerHTML = `<div class="actions"><button data-theme="midnight">Midnight</button><button data-theme="slate">Slate</button><button data-theme="aurora">Aurora</button></div>`;
  popover.querySelectorAll('[data-theme]').forEach((btn)=>btn.addEventListener('click', ()=>{ state.data.global.themePreset = btn.dataset.theme; closePopover(); render(); }));
  const r = themeBtn.getBoundingClientRect();
  popover.style.top = `${r.top - 70}px`;
  popover.style.left = `${Math.max(10, r.left - 120)}px`;
  popover.classList.remove('hidden');
  e.stopPropagation();
}

async function login(password) {
  const hash = await sha256(password);
  if (hash !== OWNER_HASH) { authError.textContent = 'Incorrect password.'; return; }
  authError.textContent = '';
  authDialog.close();
  state.admin = true;
  render();
}

function applyTheme() {
  const preset = THEMES[state.data.global.themePreset] || THEMES.midnight;
  Object.entries(preset).forEach(([k,v]) => document.documentElement.style.setProperty(k, v));
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'portfolio-data.json'; a.click(); URL.revokeObjectURL(url);
}

function onDocumentClick(e) {
  if (popover.classList.contains('hidden')) return;
  if (!e.target.closest('#editPopover') && !e.target.closest('[data-editable]') && !e.target.closest('#themeBtn')) closePopover();
}
function closePopover() { popover.classList.add('hidden'); state.popoverTarget = null; }

function normalizePhotoSize(size) {
  if (size === 'medium') return 'wide';
  return ['small','wide','tall','large'].includes(size) ? size : 'small';
}
const esc = (s='') => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const escAttr = (s='') => esc(s).replaceAll("'", '&#39;');
const sel = (a,b) => (a===b?'selected':'');
const fileToDataUrl = (f) => new Promise((res)=>{ const r = new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(f); });
async function sha256(input) { const bytes = new TextEncoder().encode(input); const d = await crypto.subtle.digest('SHA-256', bytes); return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
