/**
 * App Logic & Dynamic Module Rendering (Conectado a API REST / PostgreSQL)
 * Sigue AGENTS.md y DESIGN.md:
 * - Estado de sesión administrado por servidor (/api/auth/me)
 * - Catálogo público (/api/public/*) separado de rutas internas
 * - Operaciones CRUD y ventas transaccionales vía /api/*
 * - Manejo explícito de estados de carga, error, 401 y 403
 */

const Store = {
  currentUser: null,
  publicMascotas: [],
  publicProductos: [],
  mascotas: [],
  productos: [],
  especies: [],
  razas: [],
  categorias: [],
  proveedores: [],
  clientes: [],
  empleados: [],
  ventas: [],
  cart: {
    clienteId: null,
    items: []
  }
};

window.Store = Store;

let currentView = 'escaparate';
let posTab = 'productos';
let loginTab = 'login';
let currentSearch = '';
let currentFilterCategory = 'all';
let pendingDeleteAction = null;
let pendingEmployeeRoleChangeId = null;
let selectedPaymentMethod = 'Efectivo';
let editingProductId = null;
let editingProductFormId = null;
let editingPetId = null;
let editingSpeciesId = null;
let editingBreedId = null;
let editingCategoryId = null;
let editingProviderId = null;
let editingClientId = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupEventListeners();
  await bootstrapSession();
}

async function bootstrapSession() {
  const contentArea = document.getElementById('main-content');
  if (contentArea) {
    renderLoadingState(contentArea, 'Verificando sesión...');
  }

  try {
    const res = await Api.auth.me();
    Store.currentUser = res.user;
    updateNavbarSession();
    updateSidebarVisibility();
    navigate('escaparate');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      Store.currentUser = null;
      updateNavbarSession();
      updateSidebarVisibility();
      navigate('escaparate');
      return;
    }

    Store.currentUser = null;
    updateNavbarSession();
    updateSidebarVisibility();
    if (contentArea) {
      renderErrorState(contentArea, 'Error de conexión con el servidor', err.message, () => bootstrapSession());
    }
  }
}

function getPetImage(pet) {
  if (pet.imagen) return pet.imagen;
  const especie = String(pet.especie || '').toLowerCase();
  const raza = String(pet.raza_nombre || '').toLowerCase();
  if (raza.includes('bulldog')) {
    return 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80';
  }
  if (raza.includes('persa')) {
    return 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80';
  }
  if (especie.includes('felino') || especie.includes('gato')) {
    return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80';
  }
  if (especie.includes('ave') || especie.includes('pájaro')) {
    return 'https://images.unsplash.com/photo-1522858547550-3404744e3260?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80';
}

function getProductImage(prod) {
  if (prod.imagen) return prod.imagen;
  const cat = String(prod.categoria_nombre || '').toLowerCase();
  if (cat.includes('accesorio') || cat.includes('paseo')) {
    return 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('higiene') || cat.includes('salud')) {
    return 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80';
  }
  if (cat.includes('juguete')) {
    return 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80';
}

function formatDateShort(value) {
  if (!value) return 'N/A';
  const str = String(value);
  return str.length >= 10 ? str.substring(0, 10) : str;
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().replace('T', ' ').substring(0, 16);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function moneyToCents(value) {
  return Math.round(Number(value) * 100);
}

function renderLoadingState(container, message = 'Cargando información...') {
  container.innerHTML = `
    <div class="empty-state-box">
      <div class="empty-state-icon">⏳</div>
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">${escapeHtml(message)}</h3>
      <p style="font-size: 13px;">Consultando la base de datos en tiempo real...</p>
    </div>
  `;
}

function renderErrorState(container, title, message, retryFn) {
  const retryId = 'retry-' + Math.random().toString(36).slice(2, 8);
  container.innerHTML = `
    <div class="empty-state-box" style="border-left: 4px solid #dc2626;">
      <div class="empty-state-icon">⚠️</div>
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 6px; color: #991b1b;">${escapeHtml(title)}</h3>
      <p style="font-size: 14px; margin-bottom: 16px;">${escapeHtml(message)}</p>
      ${retryFn ? `<button id="${retryId}" class="btn-pill btn-pill-primary btn-pill-sm">Reintentar</button>` : ''}
    </div>
  `;
  if (retryFn) {
    const btn = document.getElementById(retryId);
    if (btn) btn.addEventListener('click', retryFn);
  }
}

function handleApiFailure(err, container, retryFn) {
  if (err instanceof ApiError && err.status === 401) {
    clearActiveCart();
    Store.currentUser = null;
    updateNavbarSession();
    updateSidebarVisibility();
    showToast('Tu sesión ha expirado. Inicia sesión nuevamente.');
    navigate('login');
    return;
  }
  if (err instanceof ApiError && err.status === 403) {
    showToast(err.message || 'Acceso denegado.');
    if (container) {
      renderErrorState(container, 'Acceso Denegado (403)', err.message, null);
    }
    return;
  }
  showToast(err.message || 'Ocurrió un error al comunicarse con el servidor.');
  if (container) {
    renderErrorState(container, 'Error al cargar datos', err.message, retryFn);
  }
}

// ====================================================
// SESIÓN & NAVEGACIÓN
// ====================================================
function clearActiveCart() {
  Store.cart.items = [];
  Store.cart.clienteId = null;
}

function updateNavbarSession() {
  const container = document.getElementById('nav-session-container');
  if (!container) return;

  if (Store.currentUser) {
    const roleBadge = Store.currentUser.puesto || 'Usuario';
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="user-session-chip">
          <span><strong>${escapeHtml(Store.currentUser.nombre)}</strong> <span class="role-tag">· ${escapeHtml(roleBadge)}</span></span>
        </div>
        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="logout()">
          Cerrar Sesión
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="navigate('login')">
        Iniciar Sesión / Registrarse
      </button>
    `;
  }
}

function updateSidebarVisibility() {
  const sidebar = document.getElementById('app-sidebar-rail');
  if (!sidebar) return;

  const user = Store.currentUser;
  const isInternalStaff = user && (user.puesto === 'Gerente' || user.puesto === 'Empleado');
  const showSidebar = isInternalStaff && currentView !== 'login';

  sidebar.classList.toggle('hidden', !showSidebar);

  if (showSidebar) {
    const isGerente = user.puesto === 'Gerente';
    const navCatalogos = document.getElementById('nav-catalogos');
    const navAdmin = document.getElementById('nav-admin');
    if (navCatalogos) navCatalogos.style.display = isGerente ? 'flex' : 'none';
    if (navAdmin) navAdmin.style.display = isGerente ? 'flex' : 'none';

    const avatar = document.getElementById('user-avatar');
    if (avatar) {
      avatar.textContent = user.puesto.substring(0, 2).toUpperCase();
      avatar.title = `${user.nombre} (${user.puesto})`;
    }
  }
}

function onAuthenticated(userObj) {
  clearActiveCart();
  Store.currentUser = userObj;
  updateNavbarSession();
  updateSidebarVisibility();
  showToast(`¡Bienvenido, ${userObj.nombre}!`);

  if (userObj.puesto === 'Gerente') {
    navigate('dashboard');
  } else if (userObj.puesto === 'Empleado') {
    navigate('pos');
  } else {
    navigate('escaparate');
  }
}

async function logout() {
  try {
    await Api.auth.logout();
  } catch (err) {
    // Incluso si falla, limpiar estado local de UI
  }
  clearActiveCart();
  Store.currentUser = null;
  updateNavbarSession();
  updateSidebarVisibility();
  showToast('Has cerrado sesión');
  navigate('escaparate');
}

function setupEventListeners() {
  document.querySelectorAll('.rail-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(btn.dataset.view);
    });
  });

  const confirmDeleteBtn = document.getElementById('confirm-delete-action-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (typeof pendingDeleteAction === 'function') {
        await pendingDeleteAction();
      }
      closeDeleteConfirmModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeAllModals();
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('open');
  });
  pendingDeleteAction = null;
  pendingEmployeeRoleChangeId = null;
}

function navigate(view) {
  const user = Store.currentUser;
  const isInternal = user && (user.puesto === 'Gerente' || user.puesto === 'Empleado');
  const isGerente = user && user.puesto === 'Gerente';

  if ((view === 'dashboard' || view === 'pos' || view === 'mascotas' || view === 'productos' || view === 'clientes') && !isInternal) {
    showToast('Debes iniciar sesión con una cuenta de personal para acceder a esta área');
    view = 'login';
  } else if ((view === 'catalogos' || view === 'admin') && !isGerente) {
    showToast('Acceso exclusivo para el Administrador / Gerente');
    view = isInternal ? 'dashboard' : 'login';
  }

  currentView = view;
  updateSidebarVisibility();

  document.querySelectorAll('.rail-btn[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  switch (view) {
    case 'login':
      renderLogin(contentArea);
      break;
    case 'escaparate':
      renderEscaparate(contentArea);
      break;
    case 'dashboard':
      renderDashboard(contentArea);
      break;
    case 'pos':
      renderPOS(contentArea);
      break;
    case 'mascotas':
      renderMascotas(contentArea);
      break;
    case 'productos':
      renderProductos(contentArea);
      break;
    case 'catalogos':
      renderCatalogos(contentArea);
      break;
    case 'clientes':
      renderClientes(contentArea);
      break;
    case 'admin':
      renderAdmin(contentArea);
      break;
    default:
      renderEscaparate(contentArea);
  }
}

// ====================================================
// MÓDULO 0: AUTENTICACIÓN & REGISTRO (/login)
// ====================================================
function renderLogin(container) {
  container.innerHTML = `
    <div class="login-view-wrapper">
      <div class="login-card">
        <div class="login-card-header">
          <div class="login-brand-logo">shop<span class="violet-dot">.</span></div>
          <p class="section-subtitle">Acceso a plataforma y servicios</p>
        </div>

        <div class="login-tabs-nav">
          <button class="login-tab-btn ${loginTab === 'login' ? 'active' : ''}" onclick="switchLoginTab('login')">
            Iniciar Sesión
          </button>
          <button class="login-tab-btn ${loginTab === 'register' ? 'active' : ''}" onclick="switchLoginTab('register')">
            Registrarse
          </button>
        </div>

        <div id="auth-error-box" style="display: none; background: #fef2f2; color: #991b1b; padding: 10px 14px; border-radius: 14px; font-size: 13px; margin-bottom: 16px;"></div>

        ${loginTab === 'login' ? renderLoginForm() : renderRegisterForm()}
      </div>
    </div>
  `;
}

function switchLoginTab(tab) {
  loginTab = tab;
  renderLogin(document.getElementById('main-content'));
}

function showAuthError(msg) {
  const box = document.getElementById('auth-error-box');
  if (box) {
    box.textContent = msg;
    box.style.display = 'block';
  }
}

function renderLoginForm() {
  return `
    <form onsubmit="handleLoginSubmit(event)">
      <div class="form-group">
        <label class="form-label">Correo Electrónico</label>
        <input type="email" id="login-email" class="form-input" placeholder="ejemplo@tienda.com" required>
      </div>

      <div class="form-group">
        <label class="form-label">Contraseña</label>
        <input type="password" id="login-password" class="form-input" placeholder="••••••••" required>
      </div>

      <button type="submit" id="login-submit-btn" class="btn-pill btn-pill-primary" style="width: 100%; justify-content: center; margin-top: 8px;">
        Entrar a mi Cuenta
      </button>
    </form>
  `;
}

function renderRegisterForm() {
  return `
    <form onsubmit="handleRegisterSubmit(event)">
      <div class="form-group">
        <label class="form-label">Nombre Completo *</label>
        <input type="text" id="reg-nombre" class="form-input" placeholder="Tu nombre y apellido" required>
      </div>

      <div class="form-group">
        <label class="form-label">Teléfono (Recomendado)</label>
        <input type="tel" id="reg-telefono" class="form-input" placeholder="555-123-4567">
      </div>

      <div class="form-group">
        <label class="form-label">Correo Electrónico *</label>
        <input type="email" id="reg-email" class="form-input" placeholder="tu@correo.com" required>
      </div>

      <div class="form-group">
        <label class="form-label">Contraseña de Acceso *</label>
        <input type="password" id="reg-password" class="form-input" minlength="6" placeholder="Mínimo 6 caracteres" required>
      </div>

      <button type="submit" id="reg-submit-btn" class="btn-pill btn-pill-primary" style="width: 100%; justify-content: center; margin-top: 8px;">
        Crear Cuenta de Cliente
      </button>
    </form>
  `;
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-submit-btn');

  if (!email || !password) {
    showAuthError('Ingresa correo electrónico y contraseña.');
    return;
  }

  try {
    if (btn) btn.disabled = true;
    const data = await Api.auth.login(email, password);
    onAuthenticated(data.user);
  } catch (err) {
    showAuthError(err.message || 'Credenciales incorrectas.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value.trim();
  const telefono = document.getElementById('reg-telefono').value.trim() || 'N/A';
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const btn = document.getElementById('reg-submit-btn');

  if (!nombre || !email || password.length < 6) {
    showAuthError('Completa los campos obligatorios (contraseña mínima de 6 caracteres).');
    return;
  }

  try {
    if (btn) btn.disabled = true;
    const data = await Api.auth.register({ nombre, telefono, email, password });
    onAuthenticated(data.user);
  } catch (err) {
    showAuthError(err.message || 'No se pudo completar el registro.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ====================================================
// MÓDULO ESCAPARATE PÚBLICO (GET /api/public/*)
// ====================================================
async function renderEscaparate(container) {
  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');

  container.innerHTML = `
    <section class="hero-band">
      <div class="hero-wordmark">
        shop<span class="violet-dot">.</span>
      </div>
      <p class="section-subtitle" style="margin-bottom: 24px;">
        Descubre compañeros únicos y productos premium para su bienestar
      </p>

      <div class="search-container">
        <div class="search-pill-box">
          <input 
            type="text"
            id="escaparate-search" 
            placeholder="¿Qué estás buscando para tu mascota hoy?" 
            value="${escapeHtml(currentSearch)}"
            oninput="handleLiveSearch(this.value)"
            autocomplete="off"
          >
        </div>
      </div>

      <div class="categories-rail">
        <button class="category-chip ${currentFilterCategory === 'all' ? 'active' : ''}" onclick="filterEscaparate('all', this)">Todos</button>
        <button class="category-chip ${currentFilterCategory === 'Canino' ? 'active' : ''}" onclick="filterEscaparate('Canino', this)">🐶 Caninos</button>
        <button class="category-chip ${currentFilterCategory === 'Felino' ? 'active' : ''}" onclick="filterEscaparate('Felino', this)">🐱 Felinos</button>
        <button class="category-chip ${currentFilterCategory === 'Ave' ? 'active' : ''}" onclick="filterEscaparate('Ave', this)">🦜 Aves</button>
        <button class="category-chip ${currentFilterCategory === 'Productos' ? 'active' : ''}" onclick="filterEscaparate('Productos', this)">🛍️ Artículos & Alimentos</button>
      </div>
    </section>

    <div id="escaparate-results-container">
      <div class="empty-state-box">
        <div class="empty-state-icon">⏳</div>
        <p style="font-size: 14px;">Cargando catálogo disponible...</p>
      </div>
    </div>
  `;

  try {
    const [mascotas, productos] = await Promise.all([
      Api.public.getMascotas(),
      Api.public.getProductos()
    ]);
    Store.publicMascotas = mascotas || [];
    Store.publicProductos = productos || [];

    const resultsContainer = document.getElementById('escaparate-results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = renderEscaparateResultsHTML(isInternal);
    }
  } catch (err) {
    const resultsContainer = document.getElementById('escaparate-results-container');
    if (resultsContainer) {
      renderErrorState(resultsContainer, 'No se pudo cargar el catálogo', err.message, () => renderEscaparate(container));
    }
  }
}

function handleLiveSearch(query) {
  currentSearch = query.trim().toLowerCase();
  const resultsContainer = document.getElementById('escaparate-results-container');
  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');
  if (resultsContainer) {
    resultsContainer.innerHTML = renderEscaparateResultsHTML(isInternal);
  }
}

function filterEscaparate(category, btnEl) {
  currentFilterCategory = category;
  document.querySelectorAll('.categories-rail .category-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  if (btnEl) {
    btnEl.classList.add('active');
  }
  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');
  const resultsContainer = document.getElementById('escaparate-results-container');
  if (resultsContainer) {
    resultsContainer.innerHTML = renderEscaparateResultsHTML(isInternal);
  }
}

function renderEscaparateResultsHTML(isInternal) {
  const q = currentSearch;
  const cat = currentFilterCategory;

  let filteredPets = Store.publicMascotas.filter(m => m.estado === 'Disponible');
  if (cat !== 'all') {
    if (cat === 'Productos') {
      filteredPets = [];
    } else {
      filteredPets = filteredPets.filter(m => m.especie === cat);
    }
  }
  if (q) {
    filteredPets = filteredPets.filter(m =>
      String(m.raza_nombre || '').toLowerCase().includes(q) ||
      String(m.especie || '').toLowerCase().includes(q)
    );
  }

  let filteredProds = Store.publicProductos.filter(p => p.stock > 0);
  if (cat !== 'all' && cat !== 'Productos') {
    filteredProds = [];
  }
  if (q) {
    filteredProds = filteredProds.filter(p =>
      String(p.nombre || '').toLowerCase().includes(q) ||
      String(p.categoria_nombre || '').toLowerCase().includes(q)
    );
  }

  if (filteredPets.length === 0 && filteredProds.length === 0) {
    return `
      <div class="empty-state-box">
        <div class="empty-state-icon">🔍</div>
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">No se encontraron resultados</h3>
        <p style="font-size: 14px;">No encontramos mascotas o productos disponibles que coincidan con tu búsqueda.</p>
        <button class="btn-pill btn-pill-secondary btn-pill-sm" style="margin-top: 16px;" onclick="resetSearch()">Limpiar búsqueda</button>
      </div>
    `;
  }

  let html = '';

  if (filteredPets.length > 0) {
    html += `
      <div class="section-header">
        <div>
          <h2 class="section-title">
            Mascotas Disponibles (${filteredPets.length})
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </h2>
          <p class="section-subtitle">Listos para encontrar un nuevo hogar responsable</p>
        </div>
        ${isInternal ? `<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="navigate('mascotas')">Gestionar Catálogo</button>` : ''}
      </div>

      <div class="cards-grid-4" style="margin-bottom: 48px;">
        ${filteredPets.map(pet => `
          <div class="product-card" onclick="openPetDetail(${pet.id}, true)" style="cursor: pointer;">
            <div class="card-image-wrap">
              <img src="${escapeHtml(getPetImage(pet))}" alt="${escapeHtml(pet.raza_nombre)}">
              <span class="card-badge badge-success">${escapeHtml(pet.estado)}</span>
            </div>
            <div class="card-content">
              <div>
                <div class="card-title">${escapeHtml(pet.raza_nombre)}</div>
                <div class="card-meta">${escapeHtml(pet.especie)} · Nacimiento: ${escapeHtml(formatDateShort(pet.fecha_nacimiento))}</div>
              </div>
              <div class="card-footer-row" onclick="event.stopPropagation()">
                <span class="card-price">$${Number(pet.precio).toLocaleString()}</span>
                <div style="display: flex; gap: 4px;">
                  <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openPetDetail(${pet.id}, true)">Detalles</button>
                  ${isInternal ? `<button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addPetToPOS(${pet.id})">+ POS</button>` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (filteredProds.length > 0) {
    html += `
      <div class="section-header">
        <div>
          <h2 class="section-title">
            Nutrición y Cuidados (${filteredProds.length})
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </h2>
          <p class="section-subtitle">Marcas líderes seleccionadas por nuestros especialistas</p>
        </div>
        ${isInternal ? `<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="navigate('productos')">Gestionar Stock</button>` : ''}
      </div>

      <div class="cards-grid-4">
        ${filteredProds.map(prod => `
          <div class="product-card" onclick="openProductDetail(${prod.id}, true)" style="cursor: pointer;">
            <div class="card-image-wrap">
              <img src="${escapeHtml(getProductImage(prod))}" alt="${escapeHtml(prod.nombre)}">
              ${prod.stock <= 5 ? `<span class="card-badge badge-warning">Últimas ${prod.stock} pzas</span>` : `<span class="card-badge badge-success">${prod.stock} en stock</span>`}
            </div>
            <div class="card-content">
              <div>
                <div class="card-title">${escapeHtml(prod.nombre)}</div>
                <div class="card-meta">${escapeHtml(prod.categoria_nombre)}</div>
              </div>
              <div class="card-footer-row" onclick="event.stopPropagation()">
                <span class="card-price">$${Number(prod.precio).toLocaleString()}</span>
                <div style="display: flex; gap: 4px;">
                  <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openProductDetail(${prod.id}, true)">Detalles</button>
                  ${isInternal ? `<button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addProdToPOS(${prod.id})">+ POS</button>` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  return html;
}

function resetSearch() {
  currentSearch = '';
  currentFilterCategory = 'all';
  const searchInput = document.getElementById('escaparate-search');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.categories-rail .category-chip').forEach(c => c.classList.remove('active'));
  const firstChip = document.querySelector('.categories-rail .category-chip');
  if (firstChip) firstChip.classList.add('active');
  const resultsContainer = document.getElementById('escaparate-results-container');
  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');
  if (resultsContainer) {
    resultsContainer.innerHTML = renderEscaparateResultsHTML(isInternal);
  }
}

// ====================================================
// DETALLES DE PRODUCTOS Y MASCOTAS (Público e Interno)
// ====================================================
async function openPetDetail(petId, isPublicContext = false) {
  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');
  const modal = document.getElementById('detail-modal');
  const title = document.getElementById('detail-modal-title');
  const body = document.getElementById('detail-modal-body');
  const footer = document.getElementById('detail-modal-footer');

  title.textContent = 'Cargando detalle...';
  body.innerHTML = '<p style="font-size: 14px; color: var(--color-muted-gray);">Consultando servidor...</p>';
  footer.innerHTML = '<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="closeDetailModal()">Cerrar</button>';
  modal.classList.add('open');

  try {
    const pet = (isInternal && !isPublicContext)
      ? await Api.mascotas.get(petId)
      : await Api.public.getMascota(petId);

    title.textContent = `Detalles de la Mascota: ${pet.raza_nombre}`;
    body.innerHTML = `
      <div style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-inner-img); overflow: hidden; margin-bottom: 16px; background: #f0f0f0;">
        <img src="${escapeHtml(getPetImage(pet))}" alt="${escapeHtml(pet.raza_nombre)}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="background: var(--color-canvas-mist); padding: 14px 18px; border-radius: var(--radius-pills); margin-bottom: 16px;">
        <div class="detail-info-row">
          <span class="detail-label">Especie:</span>
          <span class="detail-value">${escapeHtml(pet.especie)}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-label">Raza:</span>
          <span class="detail-value">${escapeHtml(pet.raza_nombre)}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-label">Fecha de Nacimiento:</span>
          <span class="detail-value">${escapeHtml(formatDateShort(pet.fecha_nacimiento))}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-label">Estado:</span>
          <span class="detail-value" style="color: ${pet.estado === 'Disponible' ? '#166534' : '#92400e'};">${escapeHtml(pet.estado)}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-label">Precio al Público:</span>
          <span class="detail-value" style="font-size: 18px; color: var(--color-shop-violet);">$${Number(pet.precio).toLocaleString()}</span>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="closeDetailModal()">Cerrar</button>
      ${isInternal && pet.estado === 'Disponible' ? `
        <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addPetToPOS(${pet.id}); closeDetailModal();">+ Agregar a Venta (POS)</button>
      ` : !isInternal ? `
        <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="showToast('Disponible en sucursal física'); closeDetailModal();">Consultar Disponibilidad</button>
      ` : ''}
    `;
  } catch (err) {
    title.textContent = 'Error';
    body.innerHTML = `<p style="color: #991b1b; font-size: 14px;">${escapeHtml(err.message)}</p>`;
  }
}

async function openProductDetail(productId, isPublicContext = false) {
  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');
  const modal = document.getElementById('detail-modal');
  const title = document.getElementById('detail-modal-title');
  const body = document.getElementById('detail-modal-body');
  const footer = document.getElementById('detail-modal-footer');

  title.textContent = 'Cargando detalle...';
  body.innerHTML = '<p style="font-size: 14px; color: var(--color-muted-gray);">Consultando servidor...</p>';
  footer.innerHTML = '<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="closeDetailModal()">Cerrar</button>';
  modal.classList.add('open');

  try {
    const prod = (isInternal && !isPublicContext)
      ? await Api.productos.get(productId)
      : await Api.public.getProducto(productId);

    title.textContent = 'Detalles del Producto';
    body.innerHTML = `
      <div style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-inner-img); overflow: hidden; margin-bottom: 16px; background: #f0f0f0;">
        <img src="${escapeHtml(getProductImage(prod))}" alt="${escapeHtml(prod.nombre)}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="background: var(--color-canvas-mist); padding: 14px 18px; border-radius: var(--radius-pills); margin-bottom: 16px;">
        <div class="detail-info-row">
          <span class="detail-label">Producto:</span>
          <span class="detail-value">${escapeHtml(prod.nombre)}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-label">Categoría:</span>
          <span class="detail-value">${escapeHtml(prod.categoria_nombre)}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-label">Stock Disponible:</span>
          <span class="detail-value" style="color: ${prod.stock <= 5 ? '#991b1b' : '#166534'};">${prod.stock} unidades</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-label">Precio al Público:</span>
          <span class="detail-value" style="font-size: 18px; color: var(--color-shop-violet);">$${Number(prod.precio).toLocaleString()}</span>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="closeDetailModal()">Cerrar</button>
      ${isInternal && prod.stock > 0 ? `
        <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addProdToPOS(${prod.id}); closeDetailModal();">+ Agregar a Venta (POS)</button>
      ` : !isInternal ? `
        <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="showToast('Disponible en tienda física'); closeDetailModal();">Ver en Tienda</button>
      ` : ''}
    `;
  } catch (err) {
    title.textContent = 'Error';
    body.innerHTML = `<p style="color: #991b1b; font-size: 14px;">${escapeHtml(err.message)}</p>`;
  }
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.remove('open');
}

// ====================================================
// CONFIRMACIÓN PARA ELIMINACIÓN
// ====================================================
function showDeleteConfirmModal(itemName, itemType, onConfirmCallback) {
  const modal = document.getElementById('delete-confirm-modal');
  const body = document.getElementById('delete-confirm-body');

  body.innerHTML = `
    ¿Estás seguro de que deseas eliminar permanentemente ${escapeHtml(itemType)} <strong>"${escapeHtml(itemName)}"</strong> del sistema?
    <br><br>
    <span style="font-size: 12px; color: var(--color-muted-gray);">Esta acción eliminará el registro de la base de datos.</span>
  `;

  pendingDeleteAction = onConfirmCallback;
  modal.classList.add('open');
}

function closeDeleteConfirmModal() {
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) modal.classList.remove('open');
  pendingDeleteAction = null;
}

// ====================================================
// MÓDULO 1: DASHBOARD GENERAL (/dashboard)
// ====================================================
async function renderDashboard(container) {
  renderLoadingState(container, 'Cargando Dashboard...');

  try {
    const [mascotas, productos, ventas] = await Promise.all([
      Api.mascotas.list(),
      Api.productos.list(),
      Api.ventas.list()
    ]);

    Store.mascotas = mascotas;
    Store.productos = productos;
    Store.ventas = ventas;

    const dispPets = mascotas.filter(m => m.estado === 'Disponible').length;
    const quarPets = mascotas.filter(m => m.estado === 'Cuarentena').length;
    const lowStockProds = productos.filter(p => p.stock <= 5);
    const totalVentasCents = ventas.reduce((acc, v) => acc + moneyToCents(v.total), 0);

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="section-title">Dashboard General</h1>
          <p class="section-subtitle">Métricas en tiempo real desde PostgreSQL</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-pill btn-pill-primary" onclick="navigate('pos')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Venta (POS)
          </button>
        </div>
      </div>

      <div class="cards-grid-3" style="margin-bottom: 32px;">
        <div class="product-card" style="padding: 24px;">
          <div class="card-meta">VENTAS REGISTRADAS</div>
          <div style="font-size: 32px; font-weight: 600; letter-spacing: -0.05em; margin: 8px 0;">
            $${(totalVentasCents / 100).toLocaleString()}
          </div>
          <div style="font-size: 12px; color: #166534; font-weight: 500;">
            + ${ventas.length} transacciones cerradas
          </div>
        </div>

        <div class="product-card" style="padding: 24px;">
          <div class="card-meta">CENSO DE MASCOTAS</div>
          <div style="font-size: 32px; font-weight: 600; letter-spacing: -0.05em; margin: 8px 0;">
            ${dispPets} <span style="font-size: 16px; color: var(--color-muted-gray); font-weight: 400;">disponibles</span>
          </div>
          <div style="font-size: 12px; color: #b45309; font-weight: 500;">
            ⚠️ ${quarPets} en observación / cuarentena
          </div>
        </div>

        <div class="product-card" style="padding: 24px;">
          <div class="card-meta">ALERTAS DE REABASTECIMIENTO</div>
          <div style="font-size: 32px; font-weight: 600; letter-spacing: -0.05em; margin: 8px 0;">
            ${lowStockProds.length} <span style="font-size: 16px; color: #991b1b; font-weight: 400;">artículos críticos</span>
          </div>
          <div style="font-size: 12px; color: var(--color-muted-gray);">
            Stock menor o igual a 5 unidades
          </div>
        </div>
      </div>

      ${lowStockProds.length > 0 ? `
        <div class="data-card" style="margin-bottom: 32px; border-left: 4px solid #ef4444;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 16px; font-weight: 600;">⚠️ Alerta de Inventario Crítico</h3>
            ${Store.currentUser && Store.currentUser.puesto === 'Gerente' ? `<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="navigate('productos')">Reabastecer</button>` : ''}
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            ${lowStockProds.map(p => `
              <div style="background: #fef2f2; padding: 8px 16px; border-radius: 9999px; font-size: 13px; color: #991b1b; font-weight: 500;">
                ${escapeHtml(p.nombre)}: <strong>${p.stock} unidades</strong>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="data-card">
        <div class="section-header" style="margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 600;">Últimas Transacciones (POS)</h3>
            <p class="section-subtitle">Mostrando las 5 transacciones más recientes</p>
          </div>
          ${Store.currentUser && Store.currentUser.puesto === 'Gerente' ? `
            <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="navigate('admin')">Auditoría Completa</button>
          ` : ''}
        </div>
        <div class="table-responsive">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Atendido por</th>
                <th>Fecha y Hora</th>
                <th>Total</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${ventas.length === 0 ? `
                <tr><td colspan="6" style="text-align: center; color: var(--color-muted-gray);">No hay ventas registradas aún.</td></tr>
              ` : ventas.slice(0, 5).map(v => `
                <tr>
                  <td><strong>${escapeHtml(v.folio)}</strong></td>
                  <td>${escapeHtml(v.cliente_nombre)}</td>
                  <td>${escapeHtml(v.empleado_nombre)}</td>
                  <td>${escapeHtml(formatDateTime(v.fecha_hora))}</td>
                  <td><strong>$${Number(v.total).toLocaleString()}</strong></td>
                  <td>
                    <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="showTicketModal(${v.id})">Desglose</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    handleApiFailure(err, container, () => renderDashboard(container));
  }
}

// ====================================================
// MÓDULO 2: PUNTO DE VENTA (POS)
// ====================================================
async function renderPOS(container) {
  renderLoadingState(container, 'Cargando Punto de Venta...');

  try {
    const [productos, mascotas, clientes] = await Promise.all([
      Api.productos.list(),
      Api.mascotas.list(),
      Api.clientes.list()
    ]);

    Store.productos = productos;
    Store.mascotas = mascotas;
    Store.clientes = clientes;

    if (!Store.cart.clienteId && clientes.length > 0) {
      Store.cart.clienteId = clientes[0].id;
    }

    drawPOSView(container);
  } catch (err) {
    handleApiFailure(err, container, () => renderPOS(container));
  }
}

function drawPOSView(container) {
  const dispPets = Store.mascotas.filter(m => m.estado === 'Disponible');
  const dispProds = Store.productos.filter(p => p.stock > 0);
  const subtotalCents = Store.cart.items.reduce((acc, item) => acc + moneyToCents(item.precio) * item.cantidad, 0);
  const subtotal = subtotalCents / 100;
  const total = subtotal;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Terminal Punto de Venta (POS)</h1>
        <p class="section-subtitle">Cobro ágil en mostrador con validación transaccional en servidor</p>
      </div>
      <div class="user-session-chip">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
        Caja Conectada
      </div>
    </div>

    <div class="pos-container">
      <div class="pos-catalog-panel">
        <div class="pos-tab-bar">
          <button class="pos-tab ${posTab === 'productos' ? 'active' : ''}" onclick="switchPOSTab('productos')">
            📦 Productos (${dispProds.length})
          </button>
          <button class="pos-tab ${posTab === 'mascotas' ? 'active' : ''}" onclick="switchPOSTab('mascotas')">
            🐾 Mascotas Disponibles (${dispPets.length})
          </button>
        </div>

        ${posTab === 'productos' ? `
          <div class="cards-grid-3">
            ${dispProds.map(prod => `
              <div class="product-card" style="padding: 8px;">
                <div class="card-image-wrap" style="aspect-ratio: 4/3;">
                  <img src="${escapeHtml(getProductImage(prod))}" alt="${escapeHtml(prod.nombre)}">
                  <span class="card-badge badge-success">Stock: ${prod.stock}</span>
                </div>
                <div class="card-content">
                  <div class="card-title" style="font-size: 14px;">${escapeHtml(prod.nombre)}</div>
                  <div class="card-meta">${escapeHtml(prod.categoria_nombre)}</div>
                  <div class="card-footer-row">
                    <span class="card-price">$${Number(prod.precio).toLocaleString()}</span>
                    <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addProdToPOS(${prod.id})">+ Agregar</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="cards-grid-3">
            ${dispPets.map(pet => `
              <div class="product-card" style="padding: 8px;">
                <div class="card-image-wrap" style="aspect-ratio: 4/3;">
                  <img src="${escapeHtml(getPetImage(pet))}" alt="${escapeHtml(pet.raza_nombre)}">
                  <span class="card-badge badge-success">Vivo Único</span>
                </div>
                <div class="card-content">
                  <div class="card-title" style="font-size: 14px;">${escapeHtml(pet.raza_nombre)}</div>
                  <div class="card-meta">${escapeHtml(pet.especie)} · Nacimiento: ${escapeHtml(formatDateShort(pet.fecha_nacimiento))}</div>
                  <div class="card-footer-row">
                    <span class="card-price">$${Number(pet.precio).toLocaleString()}</span>
                    <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addPetToPOS(${pet.id})">+ Agregar</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <div class="pos-ticket-panel">
        <div class="ticket-header">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 16px;">Ticket de Venta</strong>
            <span style="font-size: 12px; color: var(--color-muted-gray);">Atiende: ${escapeHtml(Store.currentUser ? Store.currentUser.nombre : 'Empleado')}</span>
          </div>

          <div class="form-group" style="margin-bottom: 8px;">
            <label class="form-label">Cliente Receptor</label>
            <select class="form-select" onchange="changePOSClient(this.value)">
              ${Store.clientes.map(c => `
                <option value="${c.id}" ${c.id === Store.cart.clienteId ? 'selected' : ''}>
                  ${escapeHtml(c.nombre)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="ticket-cart-items">
          ${Store.cart.items.length === 0 ? `
            <div style="text-align: center; color: var(--color-muted-gray); padding: 40px 0; font-size: 14px;">
              El carrito está vacío.<br>Selecciona productos o mascotas para facturar.
            </div>
          ` : Store.cart.items.map((item, idx) => `
            <div class="cart-item-row">
              <div class="cart-item-info">
                <span class="cart-item-name">${escapeHtml(item.nombre)}</span>
                <span class="cart-item-sub">
                  ${item.tipo === 'mascota' ? '🐾 Mascota viva (Ítem Único)' : `$${Number(item.precio).toLocaleString()} c/u`}
                </span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                ${item.tipo === 'producto' ? `
                  <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateQty(${idx}, -1)">-</button>
                    <span style="font-size: 14px; font-weight: 600; min-width: 16px; text-align: center;">${item.cantidad}</span>
                    <button class="qty-btn" onclick="updateQty(${idx}, 1)">+</button>
                  </div>
                ` : `
                  <span style="font-size: 12px; font-weight: 600; color: var(--color-muted-gray);">Cant: 1</span>
                `}
                
                <span style="font-size: 14px; font-weight: 600; min-width: 65px; text-align: right;">
                  $${((moneyToCents(item.precio) * item.cantidad) / 100).toLocaleString()}
                </span>
                <button onclick="removeCartItem(${idx})" style="background: none; border: none; cursor: pointer; color: #991b1b; font-size: 16px;">×</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="ticket-totals">
          <div class="total-row">
            <span>Subtotal estimado</span>
            <span>$${subtotal.toLocaleString()}</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL ESTIMADO</span>
            <span>$${total.toLocaleString()}</span>
          </div>

          <button 
            class="btn-pill btn-pill-primary" 
            style="width: 100%; justify-content: center; margin-top: 12px; padding: 12px;"
            ${Store.cart.items.length === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
            onclick="finalizeSale()"
          >
            Continuar a Confirmación
          </button>
        </div>
      </div>
    </div>
  `;
}

function switchPOSTab(tab) {
  posTab = tab;
  drawPOSView(document.getElementById('main-content'));
}

function changePOSClient(clientId) {
  Store.cart.clienteId = parseInt(clientId, 10);
  drawPOSView(document.getElementById('main-content'));
}

function addProdToPOS(prodId) {
  const prod = Store.productos.find(p => p.id === prodId) || Store.publicProductos.find(p => p.id === prodId);
  if (!prod) return;

  const existing = Store.cart.items.find(i => i.id === prodId && i.tipo === 'producto');
  if (existing) {
    if (existing.cantidad + 1 > prod.stock) {
      showToast('No hay suficiente stock disponible');
      return;
    }
    existing.cantidad += 1;
  } else {
    Store.cart.items.push({
      id: prod.id,
      tipo: 'producto',
      nombre: prod.nombre,
      precio: Number(prod.precio),
      cantidad: 1
    });
  }

  showToast(`Añadido: ${prod.nombre}`);
  if (currentView === 'pos') {
    drawPOSView(document.getElementById('main-content'));
  }
}

function addPetToPOS(petId) {
  const pet = Store.mascotas.find(m => m.id === petId) || Store.publicMascotas.find(m => m.id === petId);
  if (!pet || pet.estado !== 'Disponible') {
    showToast('Esta mascota no está disponible para venta');
    return;
  }

  const existing = Store.cart.items.find(i => i.id === petId && i.tipo === 'mascota');
  if (existing) {
    showToast('La mascota ya está en el ticket (ítem único)');
    return;
  }

  Store.cart.items.push({
    id: pet.id,
    tipo: 'mascota',
    nombre: `Mascota: ${pet.raza_nombre}`,
    precio: Number(pet.precio),
    cantidad: 1
  });

  showToast(`Mascota añadida al ticket: ${pet.raza_nombre}`);
  if (currentView === 'pos') {
    drawPOSView(document.getElementById('main-content'));
  }
}

function updateQty(index, delta) {
  const item = Store.cart.items[index];
  if (!item) return;

  if (item.tipo === 'producto') {
    const prod = Store.productos.find(p => p.id === item.id);
    const newQty = item.cantidad + delta;
    if (newQty <= 0) {
      Store.cart.items.splice(index, 1);
    } else if (prod && newQty > prod.stock) {
      showToast('Límite de stock alcanzado');
    } else {
      item.cantidad = newQty;
    }
  }

  drawPOSView(document.getElementById('main-content'));
}

function removeCartItem(index) {
  Store.cart.items.splice(index, 1);
  drawPOSView(document.getElementById('main-content'));
}

function finalizeSale() {
  if (Store.cart.items.length === 0) return;

  const client = Store.clientes.find(c => c.id === Store.cart.clienteId) || Store.clientes[0];
  if (!client) {
    showToast('Selecciona un cliente válido antes de cobrar');
    return;
  }

  const subtotalCents = Store.cart.items.reduce((acc, item) => acc + moneyToCents(item.precio) * item.cantidad, 0);
  const subtotal = subtotalCents / 100;
  const modal = document.getElementById('sale-confirm-modal');
  const body = document.getElementById('sale-confirm-body');

  selectedPaymentMethod = 'Efectivo';

  body.innerHTML = `
    <div style="background: var(--color-canvas-mist); padding: 14px 18px; border-radius: var(--radius-pills); margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--color-muted-gray); margin-bottom: 8px;">
        <span>Cliente: <strong>${escapeHtml(client.nombre)}</strong></span>
        <span>Atiende: <strong>${escapeHtml(Store.currentUser ? Store.currentUser.nombre : 'Empleado')}</strong></span>
      </div>
      <div style="max-height: 140px; overflow-y: auto; margin-bottom: 8px; border-top: 1px dashed var(--color-faint-border); padding-top: 8px;">
        ${Store.cart.items.map(it => `
          <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0;">
            <span>${it.cantidad}x ${escapeHtml(it.nombre)}</span>
            <span>$${((moneyToCents(it.precio) * it.cantidad) / 100).toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
      <div class="detail-info-row" style="border-top: 1px solid var(--color-faint-border); padding-top: 8px;">
        <span class="detail-label">Subtotal:</span>
        <span class="detail-value">$${subtotal.toLocaleString()}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label" style="font-size: 16px;">TOTAL A COBRAR:</span>
        <span class="detail-value" style="font-size: 20px; color: var(--color-shop-violet);">$${subtotal.toLocaleString()}</span>
      </div>
    </div>

    <div>
      <label class="form-label">Selecciona el Método de Pago *</label>
      <div class="payment-methods-grid">
        <button type="button" class="payment-method-btn active" onclick="selectPaymentMethod('Efectivo', this)">💵 Efectivo</button>
        <button type="button" class="payment-method-btn" onclick="selectPaymentMethod('Tarjeta de Débito/Crédito', this)">💳 Tarjeta</button>
        <button type="button" class="payment-method-btn" onclick="selectPaymentMethod('Transferencia SPEI', this)">📱 Transferencia</button>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function selectPaymentMethod(method, btnElement) {
  selectedPaymentMethod = method;
  document.querySelectorAll('.payment-method-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');
}

function closeSaleConfirmModal() {
  document.getElementById('sale-confirm-modal').classList.remove('open');
}

async function processConfirmedSale() {
  if (Store.cart.items.length === 0) return;

  const clientId = Store.cart.clienteId || (Store.clientes[0] && Store.clientes[0].id);
  const productosPayload = Store.cart.items
    .filter(i => i.tipo === 'producto')
    .map(i => ({ id_producto: i.id, cantidad: i.cantidad }));
  const mascotasPayload = Store.cart.items
    .filter(i => i.tipo === 'mascota')
    .map(i => ({ id_mascota: i.id }));

  try {
    const createdVenta = await Api.ventas.create({
      id_cliente: clientId,
      productos: productosPayload,
      mascotas: mascotasPayload
    });

    Store.cart.items = [];
    closeSaleConfirmModal();
    showToast(`¡Venta registrada! Folio: ${createdVenta.folio} · Total: $${Number(createdVenta.total).toLocaleString()} (${selectedPaymentMethod})`);
    await renderPOS(document.getElementById('main-content'));
  } catch (err) {
    closeSaleConfirmModal();
    handleApiFailure(err, null, null);
  }
}

// ====================================================
// MÓDULO 3: GESTIÓN DE MASCOTAS (/mascotas)
// ====================================================
async function renderMascotas(container) {
  const isGerente = Store.currentUser && Store.currentUser.puesto === 'Gerente';
  renderLoadingState(container, 'Cargando inventario de mascotas...');

  try {
    const mascotas = await Api.mascotas.list();
    Store.mascotas = mascotas;

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="section-title">Inventario de Mascotas</h1>
          <p class="section-subtitle">
            ${isGerente ? 'Gestión clínica y comercial de ejemplares vivos (Acceso CRUD Total)' : 'Consulta de disponibilidad de ejemplares (Modo Lectura)'}
          </p>
        </div>
        <div>
          ${isGerente ? `
            <button class="btn-pill btn-pill-primary" onclick="openNewPetModal()">
              + Dar de Alta Mascota
            </button>
          ` : `
            <span class="user-session-chip">Modo Consulta (Restricción de Rol Empleado)</span>
          `}
        </div>
      </div>

      <div class="data-card">
        <div class="table-responsive">
          <table class="clean-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ejemplar</th>
                <th>Especie</th>
                <th>Raza</th>
                <th>Nacimiento</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${mascotas.map(pet => `
                <tr>
                  <td>#${pet.id}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${escapeHtml(getPetImage(pet))}" alt="${escapeHtml(pet.raza_nombre)}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;">
                      <strong>${escapeHtml(pet.raza_nombre)}</strong>
                    </div>
                  </td>
                  <td>${escapeHtml(pet.especie)}</td>
                  <td>${escapeHtml(pet.raza_nombre)}</td>
                  <td>${escapeHtml(formatDateShort(pet.fecha_nacimiento))}</td>
                  <td><strong>$${Number(pet.precio).toLocaleString()}</strong></td>
                  <td>
                    <span class="card-badge ${pet.estado === 'Disponible' ? 'badge-success' : pet.estado === 'Cuarentena' ? 'badge-warning' : 'badge-danger'}" style="position: static;">
                      ${escapeHtml(pet.estado)}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openPetDetail(${pet.id}, false)">Detalle</button>
                      ${isGerente ? `
                        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openEditPetModal(${pet.id})">Editar</button>
                        ${pet.estado === 'Cuarentena' ? `
                          <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="changePetStatus(${pet.id}, 'Disponible')">Liberar a Venta</button>
                        ` : pet.estado === 'Disponible' ? `
                          <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="changePetStatus(${pet.id}, 'Cuarentena')">A Cuarentena</button>
                        ` : ''}
                        <button class="btn-pill btn-pill-danger btn-pill-sm" onclick="confirmDeletePet(${pet.id})">Eliminar</button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    handleApiFailure(err, container, () => renderMascotas(container));
  }
}

async function changePetStatus(id, newStatus) {
  try {
    await Api.mascotas.update(id, { estado: newStatus });
    showToast(`Estado de mascota #${id} cambiado a: ${newStatus}`);
    await renderMascotas(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

function confirmDeletePet(id) {
  const pet = Store.mascotas.find(m => m.id === id);
  if (!pet) return;

  showDeleteConfirmModal(pet.raza_nombre, 'la mascota', async () => {
    try {
      await Api.mascotas.remove(id);
      showToast(`Mascota "${pet.raza_nombre}" eliminada del catálogo.`);
      await renderMascotas(document.getElementById('main-content'));
    } catch (err) {
      handleApiFailure(err, null, null);
    }
  });
}

async function openNewPetModal() {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede dar de alta mascotas');
    return;
  }

  try {
    const [especies, razas, proveedores] = await Promise.all([
      Api.especies.list(),
      Api.razas.list(),
      Api.proveedores.list()
    ]);
    Store.especies = especies;
    Store.razas = razas;
    Store.proveedores = proveedores;

    const especieSelect = document.getElementById('pet-especie-input');
    const proveedorSelect = document.getElementById('pet-proveedor-input');

    especieSelect.innerHTML = especies.map(e => `<option value="${e.id}">${escapeHtml(e.nombre)}</option>`).join('');
    proveedorSelect.innerHTML = proveedores.map(p => `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`).join('');

    document.getElementById('pet-form').reset();
    editingPetId = null;
    document.getElementById('pet-modal-title').textContent = 'Alta de Mascota';
    document.getElementById('pet-submit-btn').textContent = 'Dar de Alta Mascota';
    if (especies[0]) {
      especieSelect.value = String(especies[0].id);
      handlePetEspecieChange(especies[0].id);
    }
    document.getElementById('pet-fecha-input').value = new Date().toISOString().substring(0, 10);
    document.getElementById('pet-modal').classList.add('open');
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

async function openEditPetModal(id) {
  const pet = Store.mascotas.find(item => item.id === id);
  if (!pet) return;

  try {
    const [especies, razas, proveedores] = await Promise.all([
      Api.especies.list(),
      Api.razas.list(),
      Api.proveedores.list()
    ]);
    Store.especies = especies;
    Store.razas = razas;
    Store.proveedores = proveedores;

    document.getElementById('pet-especie-input').innerHTML = especies
      .map(especie => `<option value="${especie.id}">${escapeHtml(especie.nombre)}</option>`)
      .join('');
    document.getElementById('pet-proveedor-input').innerHTML = proveedores
      .map(provider => `<option value="${provider.id}">${escapeHtml(provider.nombre)}</option>`)
      .join('');
    document.getElementById('pet-form').reset();

    const breed = razas.find(item => item.id === pet.id_raza);
    if (!breed) {
      showToast('No se encontró la raza de esta mascota.');
      return;
    }

    document.getElementById('pet-especie-input').value = String(breed.id_especie);
    handlePetEspecieChange(breed.id_especie);
    document.getElementById('pet-raza-input').value = String(pet.id_raza);
    document.getElementById('pet-proveedor-input').value = String(pet.id_proveedor);
    document.getElementById('pet-fecha-input').value = formatDateShort(pet.fecha_nacimiento);
    document.getElementById('pet-precio-input').value = pet.precio;
    document.getElementById('pet-estado-input').value = pet.estado;
    document.getElementById('pet-imagen-input').value = pet.imagen || '';
    editingPetId = id;
    document.getElementById('pet-modal-title').textContent = 'Editar Mascota';
    document.getElementById('pet-submit-btn').textContent = 'Guardar Cambios';
    document.getElementById('pet-modal').classList.add('open');
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

function handlePetEspecieChange(especieId) {
  const razaSelect = document.getElementById('pet-raza-input');
  const idNum = parseInt(especieId, 10);
  const razasFiltradas = Store.razas.filter(r => r.id_especie === idNum);
  if (razasFiltradas.length === 0) {
    razaSelect.innerHTML = '<option value="">Sin razas registradas</option>';
    return;
  }
  razaSelect.innerHTML = razasFiltradas.map(r => `<option value="${r.id}">${escapeHtml(r.nombre)}</option>`).join('');
}

function closePetModal() {
  document.getElementById('pet-modal').classList.remove('open');
  editingPetId = null;
}

async function handlePetSubmit(e) {
  e.preventDefault();
  const id_raza = parseInt(document.getElementById('pet-raza-input').value, 10);
  const id_proveedor = parseInt(document.getElementById('pet-proveedor-input').value, 10);
  const fecha_nacimiento = document.getElementById('pet-fecha-input').value;
  const precio = parseFloat(document.getElementById('pet-precio-input').value);
  const estado = document.getElementById('pet-estado-input').value;
  const imagen = document.getElementById('pet-imagen-input').value.trim();

  if (Number.isNaN(id_raza) || Number.isNaN(id_proveedor) || Number.isNaN(precio) || precio <= 0 || !fecha_nacimiento) {
    showToast('Por favor completa los campos obligatorios válidos');
    return;
  }

  try {
    const wasEditing = Boolean(editingPetId);
    const data = {
      id_raza,
      id_proveedor,
      fecha_nacimiento,
      precio,
      estado,
      imagen: imagen || null
    };
    const saved = wasEditing
      ? await Api.mascotas.update(editingPetId, data)
      : await Api.mascotas.create(data);
    closePetModal();
    showToast(`Mascota "${saved.raza_nombre}" ${wasEditing ? 'actualizada' : 'registrada en catálogo'}.`);
    await renderMascotas(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

// ====================================================
// MÓDULO 4: INVENTARIO DE PRODUCTOS (/productos)
// ====================================================
async function renderProductos(container) {
  const isGerente = Store.currentUser && Store.currentUser.puesto === 'Gerente';
  renderLoadingState(container, 'Cargando inventario de productos...');

  try {
    const productos = await Api.productos.list();
    Store.productos = productos;

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="section-title">Inventario de Productos</h1>
          <p class="section-subtitle">
            ${isGerente ? 'Control de existencias físicas y suministros (Acceso CRUD Total)' : 'Consulta de catálogo y existencias para venta (Modo Lectura)'}
          </p>
        </div>
        <div>
          ${isGerente ? `
            <button class="btn-pill btn-pill-primary" onclick="openNewProductModal()">
              + Nuevo Producto
            </button>
          ` : `
            <span class="user-session-chip">Modo Consulta (Restricción de Rol Empleado)</span>
          `}
        </div>
      </div>

      <div class="data-card">
        <div class="table-responsive">
          <table class="clean-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Precio Venta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${productos.map(p => `
                <tr>
                  <td>#${p.id}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${escapeHtml(getProductImage(p))}" alt="${escapeHtml(p.nombre)}" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover;">
                      <strong>${escapeHtml(p.nombre)}</strong>
                    </div>
                  </td>
                  <td>${escapeHtml(p.categoria_nombre)}</td>
                  <td>
                    <span class="card-badge ${p.stock <= 5 ? 'badge-warning' : 'badge-success'}" style="position: static;">
                      ${p.stock} unidades
                    </span>
                  </td>
                  <td><strong>$${Number(p.precio).toLocaleString()}</strong></td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openProductDetail(${p.id}, false)">Detalle</button>
                      ${isGerente ? `
                        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openEditProductModal(${p.id})">Editar</button>
                        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openStockModal(${p.id})">Stock</button>
                        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="editProductPrice(${p.id})">Precio</button>
                        <button class="btn-pill btn-pill-danger btn-pill-sm" onclick="confirmDeleteProduct(${p.id})">Eliminar</button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    handleApiFailure(err, container, () => renderProductos(container));
  }
}

function openStockModal(productId) {
  const prod = Store.productos.find(p => p.id === productId);
  if (!prod) return;

  editingProductId = productId;
  document.getElementById('product-stock-name').textContent = `Producto: "${prod.nombre}"`;
  document.getElementById('product-stock-input').value = prod.stock;
  document.getElementById('product-stock-modal').classList.add('open');
  setTimeout(() => document.getElementById('product-stock-input').focus(), 100);
}

function closeProductStockModal() {
  document.getElementById('product-stock-modal').classList.remove('open');
  editingProductId = null;
}

async function handleProductStockSubmit(e) {
  e.preventDefault();
  if (!editingProductId) return;
  const newStock = parseInt(document.getElementById('product-stock-input').value, 10);
  if (Number.isNaN(newStock) || newStock < 0) {
    showToast('Ingresa un valor de stock válido');
    return;
  }

  try {
    const updated = await Api.productos.update(editingProductId, { stock: newStock });
    closeProductStockModal();
    showToast(`Stock de "${updated.nombre}" actualizado a ${updated.stock} unidades`);
    await renderProductos(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

function editProductPrice(productId) {
  const prod = Store.productos.find(p => p.id === productId);
  if (!prod) return;

  editingProductId = productId;
  document.getElementById('product-price-name').textContent = `Producto: "${prod.nombre}"`;
  document.getElementById('product-price-input').value = prod.precio;
  document.getElementById('product-price-modal').classList.add('open');
  setTimeout(() => document.getElementById('product-price-input').focus(), 100);
}

function closeProductPriceModal() {
  document.getElementById('product-price-modal').classList.remove('open');
  editingProductId = null;
}

async function handleProductPriceSubmit(e) {
  e.preventDefault();
  if (!editingProductId) return;
  const newPrice = parseFloat(document.getElementById('product-price-input').value);
  if (Number.isNaN(newPrice) || newPrice <= 0) {
    showToast('Ingresa un precio válido');
    return;
  }

  try {
    const updated = await Api.productos.update(editingProductId, { precio: newPrice });
    closeProductPriceModal();
    showToast(`Precio de "${updated.nombre}" actualizado a $${Number(updated.precio).toLocaleString()}`);
    await renderProductos(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

function confirmDeleteProduct(id) {
  const prod = Store.productos.find(p => p.id === id);
  if (!prod) return;

  showDeleteConfirmModal(prod.nombre, 'el producto', async () => {
    try {
      await Api.productos.remove(id);
      showToast(`Producto "${prod.nombre}" eliminado del catálogo.`);
      await renderProductos(document.getElementById('main-content'));
    } catch (err) {
      handleApiFailure(err, null, null);
    }
  });
}

async function openNewProductModal() {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede registrar productos');
    return;
  }

  try {
    const [categorias, proveedores] = await Promise.all([
      Api.categorias.list(),
      Api.proveedores.list()
    ]);
    Store.categorias = categorias;
    Store.proveedores = proveedores;

    document.getElementById('prod-categoria-input').innerHTML = categorias.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');
    document.getElementById('prod-proveedor-input').innerHTML = proveedores.map(p => `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`).join('');

    document.getElementById('product-create-form').reset();
    editingProductFormId = null;
    document.getElementById('product-modal-title').textContent = 'Nuevo Producto';
    document.getElementById('product-submit-btn').textContent = 'Registrar Producto';
    document.getElementById('product-create-modal').classList.add('open');
    setTimeout(() => document.getElementById('prod-nombre-input').focus(), 100);
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

async function openEditProductModal(id) {
  const product = Store.productos.find(item => item.id === id);
  if (!product) return;

  try {
    const [categorias, proveedores] = await Promise.all([
      Api.categorias.list(),
      Api.proveedores.list()
    ]);
    Store.categorias = categorias;
    Store.proveedores = proveedores;
    document.getElementById('prod-categoria-input').innerHTML = categorias
      .map(category => `<option value="${category.id}">${escapeHtml(category.nombre)}</option>`)
      .join('');
    document.getElementById('prod-proveedor-input').innerHTML = proveedores
      .map(provider => `<option value="${provider.id}">${escapeHtml(provider.nombre)}</option>`)
      .join('');
    document.getElementById('product-create-form').reset();
    document.getElementById('prod-nombre-input').value = product.nombre;
    document.getElementById('prod-categoria-input').value = String(product.id_categoria_producto);
    document.getElementById('prod-proveedor-input').value = String(product.id_proveedor);
    document.getElementById('prod-imagen-input').value = product.imagen || '';
    document.getElementById('prod-precio-input').value = product.precio;
    document.getElementById('prod-stock-input').value = product.stock;
    editingProductFormId = id;
    document.getElementById('product-modal-title').textContent = 'Editar Producto';
    document.getElementById('product-submit-btn').textContent = 'Guardar Cambios';
    document.getElementById('product-create-modal').classList.add('open');
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

function closeNewProductModal() {
  document.getElementById('product-create-modal').classList.remove('open');
  editingProductFormId = null;
}

async function handleNewProductSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('prod-nombre-input').value.trim();
  const id_categoria_producto = parseInt(document.getElementById('prod-categoria-input').value, 10);
  const id_proveedor = parseInt(document.getElementById('prod-proveedor-input').value, 10);
  const precio = parseFloat(document.getElementById('prod-precio-input').value);
  const stock = parseInt(document.getElementById('prod-stock-input').value, 10);
  const imagen = document.getElementById('prod-imagen-input').value.trim();

  if (!nombre || Number.isNaN(id_categoria_producto) || Number.isNaN(id_proveedor) || Number.isNaN(precio) || precio <= 0 || Number.isNaN(stock) || stock < 0) {
    showToast('Verifica los datos del producto');
    return;
  }

  try {
    const data = {
      nombre,
      id_categoria_producto,
      id_proveedor,
      precio,
      stock,
      imagen: imagen || null
    };
    const wasEditing = Boolean(editingProductFormId);
    const saved = wasEditing
      ? await Api.productos.update(editingProductFormId, data)
      : await Api.productos.create(data);
    closeNewProductModal();
    showToast(`Producto "${saved.nombre}" ${wasEditing ? 'actualizado' : 'registrado con éxito'}.`);
    await renderProductos(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

// ====================================================
// MÓDULO 5: CATÁLOGOS MAESTROS (/catalogos)
// ====================================================
async function renderCatalogos(container) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    renderErrorState(container, 'Acceso Restringido', 'Solo el Gerente puede administrar catálogos maestros.', null);
    return;
  }
  renderLoadingState(container, 'Cargando catálogos maestros...');

  try {
    const [especies, razas, categorias, proveedores] = await Promise.all([
      Api.especies.list(),
      Api.razas.list(),
      Api.categorias.list(),
      Api.proveedores.list()
    ]);
    Store.especies = especies;
    Store.razas = razas;
    Store.categorias = categorias;
    Store.proveedores = proveedores;

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="section-title">Catálogos Maestros</h1>
          <p class="section-subtitle">Configuración estructural persistida en PostgreSQL</p>
        </div>
      </div>

      <div class="cards-grid-3" style="margin-bottom: 24px;">
        <div class="data-card">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Especies Registradas</h3>
          <ul style="list-style: none; margin-bottom: 16px;">
            ${especies.map(e => `
              <li style="padding: 6px 0; border-bottom: 1px solid var(--color-faint-border); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <span>${escapeHtml(e.nombre)} · ${razas.filter(r => r.id_especie === e.id).length} razas</span>
                <span style="display: flex; gap: 4px;">
                  <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="editSpecies(${e.id})">Editar</button>
                  <button class="btn-pill btn-pill-danger btn-pill-sm" onclick="deleteSpecies(${e.id})">Eliminar</button>
                </span>
              </li>
            `).join('')}
          </ul>
          <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openSpeciesModal()">+ Nueva Especie</button>
        </div>

        <div class="data-card">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Razas Registradas</h3>
          <ul style="list-style: none; margin-bottom: 16px;">
            ${razas.map(r => `
              <li style="padding: 6px 0; border-bottom: 1px solid var(--color-faint-border); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <span>${escapeHtml(r.nombre)} · ${escapeHtml(r.especie ? r.especie.nombre : '')}</span>
                <span style="display: flex; gap: 4px;">
                  <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="editBreed(${r.id})">Editar</button>
                  <button class="btn-pill btn-pill-danger btn-pill-sm" onclick="deleteBreed(${r.id})">Eliminar</button>
                </span>
              </li>
            `).join('')}
          </ul>
          <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openBreedModal()">+ Nueva Raza</button>
        </div>

        <div class="data-card">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Categorías de Productos</h3>
          <ul style="list-style: none; margin-bottom: 16px;">
            ${categorias.map(c => `
              <li style="padding: 6px 0; border-bottom: 1px solid var(--color-faint-border); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <span>${escapeHtml(c.nombre)}</span>
                <span style="display: flex; gap: 4px;">
                  <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="editCategory(${c.id})">Editar</button>
                  <button class="btn-pill btn-pill-danger btn-pill-sm" onclick="deleteCategory(${c.id})">Eliminar</button>
                </span>
              </li>
            `).join('')}
          </ul>
          <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openCategoryModal()">+ Nueva Categoría</button>
        </div>

        <div class="data-card">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Directorio de Proveedores</h3>
          <ul style="list-style: none; margin-bottom: 16px;">
            ${proveedores.map(p => `
              <li style="padding: 6px 0; border-bottom: 1px solid var(--color-faint-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                  <strong>${escapeHtml(p.nombre)}</strong>
                  <span style="display: flex; gap: 4px;">
                    <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="editProvider(${p.id})">Editar</button>
                    <button class="btn-pill btn-pill-danger btn-pill-sm" onclick="deleteProvider(${p.id})">Eliminar</button>
                  </span>
                </div>
                <span style="font-size: 12px; color: var(--color-muted-gray);">${escapeHtml(p.contacto)} · ${escapeHtml(p.telefono)} · ${escapeHtml(p.email)}</span>
              </li>
            `).join('')}
          </ul>
          <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openProviderModal()">+ Alta Proveedor</button>
        </div>
      </div>
    `;
  } catch (err) {
    handleApiFailure(err, container, () => renderCatalogos(container));
  }
}

function openSpeciesModal() {
  document.getElementById('species-form').reset();
  editingSpeciesId = null;
  document.getElementById('species-modal-title').textContent = 'Nueva Especie';
  document.getElementById('species-submit-btn').textContent = 'Registrar Especie';
  document.getElementById('species-modal').classList.add('open');
  setTimeout(() => document.getElementById('species-nombre-input').focus(), 100);
}

function closeSpeciesModal() {
  document.getElementById('species-modal').classList.remove('open');
  editingSpeciesId = null;
}

function editSpecies(id) {
  const species = Store.especies.find(item => item.id === id);
  if (!species) return;
  document.getElementById('species-nombre-input').value = species.nombre;
  document.getElementById('species-habitat-input').value = species.habitat;
  editingSpeciesId = id;
  document.getElementById('species-modal-title').textContent = 'Editar Especie';
  document.getElementById('species-submit-btn').textContent = 'Guardar Cambios';
  document.getElementById('species-modal').classList.add('open');
}

function deleteSpecies(id) {
  const species = Store.especies.find(item => item.id === id);
  if (!species) return;
  showDeleteConfirmModal(species.nombre, 'la especie', async () => {
    try {
      await Api.especies.remove(id);
      showToast(`Especie "${species.nombre}" eliminada.`);
      await renderCatalogos(document.getElementById('main-content'));
    } catch (err) {
      handleApiFailure(err, null, null);
    }
  });
}

async function handleSpeciesSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('species-nombre-input').value.trim();
  const habitat = document.getElementById('species-habitat-input').value.trim();
  if (!nombre || !habitat) {
    showToast('El nombre y hábitat de la especie son requeridos');
    return;
  }

  try {
    const wasEditing = Boolean(editingSpeciesId);
    if (wasEditing) {
      await Api.especies.update(editingSpeciesId, { nombre, habitat });
    } else {
      await Api.especies.create({ nombre, habitat });
    }
    closeSpeciesModal();
    showToast(`Especie "${nombre}" ${wasEditing ? 'actualizada' : 'agregada'}.`);
    await renderCatalogos(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

function openBreedModal() {
  if (Store.especies.length === 0) {
    showToast('Registra una especie antes de agregar una raza');
    return;
  }

  const select = document.getElementById('breed-especie-input');
  select.innerHTML = Store.especies.map(especie =>
    `<option value="${especie.id}">${escapeHtml(especie.nombre)}</option>`
  ).join('');
  document.getElementById('breed-form').reset();
  editingBreedId = null;
  document.getElementById('breed-modal-title').textContent = 'Nueva Raza';
  document.getElementById('breed-submit-btn').textContent = 'Registrar Raza';
  document.getElementById('breed-modal').classList.add('open');
  setTimeout(() => document.getElementById('breed-nombre-input').focus(), 100);
}

function closeBreedModal() {
  document.getElementById('breed-modal').classList.remove('open');
  editingBreedId = null;
}

function editBreed(id) {
  const breed = Store.razas.find(item => item.id === id);
  if (!breed) return;
  const select = document.getElementById('breed-especie-input');
  select.innerHTML = Store.especies
    .map(species => `<option value="${species.id}">${escapeHtml(species.nombre)}</option>`)
    .join('');
  select.value = String(breed.id_especie);
  document.getElementById('breed-nombre-input').value = breed.nombre;
  editingBreedId = id;
  document.getElementById('breed-modal-title').textContent = 'Editar Raza';
  document.getElementById('breed-submit-btn').textContent = 'Guardar Cambios';
  document.getElementById('breed-modal').classList.add('open');
}

function deleteBreed(id) {
  const breed = Store.razas.find(item => item.id === id);
  if (!breed) return;
  showDeleteConfirmModal(breed.nombre, 'la raza', async () => {
    try {
      await Api.razas.remove(id);
      showToast(`Raza "${breed.nombre}" eliminada.`);
      await renderCatalogos(document.getElementById('main-content'));
    } catch (err) {
      handleApiFailure(err, null, null);
    }
  });
}

async function handleBreedSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('breed-nombre-input').value.trim();
  const id_especie = parseInt(document.getElementById('breed-especie-input').value, 10);
  if (!nombre || Number.isNaN(id_especie)) {
    showToast('Selecciona una especie e ingresa el nombre de la raza');
    return;
  }

  try {
    const wasEditing = Boolean(editingBreedId);
    if (wasEditing) {
      await Api.razas.update(editingBreedId, { nombre, id_especie });
    } else {
      await Api.razas.create({ nombre, id_especie });
    }
    closeBreedModal();
    showToast(`Raza "${nombre}" ${wasEditing ? 'actualizada' : 'agregada'}.`);
    await renderCatalogos(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

function openCategoryModal() {
  document.getElementById('category-form').reset();
  editingCategoryId = null;
  document.getElementById('category-modal-title').textContent = 'Nueva Categoría de Producto';
  document.getElementById('category-submit-btn').textContent = 'Registrar Categoría';
  document.getElementById('category-modal').classList.add('open');
  setTimeout(() => document.getElementById('category-nombre-input').focus(), 100);
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('open');
  editingCategoryId = null;
}

function editCategory(id) {
  const category = Store.categorias.find(item => item.id === id);
  if (!category) return;
  document.getElementById('category-nombre-input').value = category.nombre;
  document.getElementById('category-descripcion-input').value = category.descripcion;
  editingCategoryId = id;
  document.getElementById('category-modal-title').textContent = 'Editar Categoría';
  document.getElementById('category-submit-btn').textContent = 'Guardar Cambios';
  document.getElementById('category-modal').classList.add('open');
}

function deleteCategory(id) {
  const category = Store.categorias.find(item => item.id === id);
  if (!category) return;
  showDeleteConfirmModal(category.nombre, 'la categoría', async () => {
    try {
      await Api.categorias.remove(id);
      showToast(`Categoría "${category.nombre}" eliminada.`);
      await renderCatalogos(document.getElementById('main-content'));
    } catch (err) {
      handleApiFailure(err, null, null);
    }
  });
}

async function handleCategorySubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('category-nombre-input').value.trim();
  const descripcion = document.getElementById('category-descripcion-input').value.trim();
  if (!nombre || !descripcion) {
    showToast('El nombre y la descripción de la categoría son requeridos');
    return;
  }

  try {
    const wasEditing = Boolean(editingCategoryId);
    if (wasEditing) {
      await Api.categorias.update(editingCategoryId, { nombre, descripcion });
    } else {
      await Api.categorias.create({ nombre, descripcion });
    }
    closeCategoryModal();
    showToast(`Categoría "${nombre}" ${wasEditing ? 'actualizada' : 'creada'}.`);
    await renderCatalogos(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

function openProviderModal() {
  document.getElementById('provider-form').reset();
  editingProviderId = null;
  document.getElementById('provider-modal-title').textContent = 'Nuevo Proveedor';
  document.getElementById('provider-submit-btn').textContent = 'Registrar Proveedor';
  document.getElementById('provider-modal').classList.add('open');
  setTimeout(() => document.getElementById('provider-nombre-input').focus(), 100);
}

function closeProviderModal() {
  document.getElementById('provider-modal').classList.remove('open');
  editingProviderId = null;
}

function editProvider(id) {
  const provider = Store.proveedores.find(item => item.id === id);
  if (!provider) return;
  document.getElementById('provider-nombre-input').value = provider.nombre;
  document.getElementById('provider-contacto-input').value = provider.contacto;
  document.getElementById('provider-telefono-input').value = provider.telefono;
  document.getElementById('provider-email-input').value = provider.email;
  editingProviderId = id;
  document.getElementById('provider-modal-title').textContent = 'Editar Proveedor';
  document.getElementById('provider-submit-btn').textContent = 'Guardar Cambios';
  document.getElementById('provider-modal').classList.add('open');
}

function deleteProvider(id) {
  const provider = Store.proveedores.find(item => item.id === id);
  if (!provider) return;
  showDeleteConfirmModal(provider.nombre, 'el proveedor', async () => {
    try {
      await Api.proveedores.remove(id);
      showToast(`Proveedor "${provider.nombre}" eliminado.`);
      await renderCatalogos(document.getElementById('main-content'));
    } catch (err) {
      handleApiFailure(err, null, null);
    }
  });
}

async function handleProviderSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('provider-nombre-input').value.trim();
  const contacto = document.getElementById('provider-contacto-input').value.trim();
  const telefono = document.getElementById('provider-telefono-input').value.trim();
  const email = document.getElementById('provider-email-input').value.trim().toLowerCase();
  if (!nombre || !contacto || !telefono || !email) {
    showToast('Completa el nombre, contacto, teléfono y correo del proveedor');
    return;
  }

  try {
    const wasEditing = Boolean(editingProviderId);
    if (wasEditing) {
      await Api.proveedores.update(editingProviderId, { nombre, contacto, telefono, email });
    } else {
      await Api.proveedores.create({ nombre, contacto, telefono, email });
    }
    closeProviderModal();
    showToast(`Proveedor "${nombre}" ${wasEditing ? 'actualizado' : 'registrado'}.`);
    await renderCatalogos(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

// ====================================================
// MÓDULO 6: DIRECTORIO DE CLIENTES (/clientes)
// ====================================================
async function renderClientes(container) {
  const isGerente = Store.currentUser && Store.currentUser.puesto === 'Gerente';
  renderLoadingState(container, 'Cargando directorio de clientes...');

  try {
    const [clientes, ventas] = await Promise.all([
      Api.clientes.list(),
      Api.ventas.list()
    ]);
    Store.clientes = clientes;
    Store.ventas = ventas;

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="section-title">Directorio de Clientes</h1>
          <p class="section-subtitle">Gestión de clientes e historial de compras</p>
        </div>
        <div>
          <button class="btn-pill btn-pill-primary" onclick="openNewClientModal()">
            + Registrar Cliente
          </button>
        </div>
      </div>

      <div class="data-card">
        <div class="table-responsive">
          <table class="clean-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Historial de Compras</th>
                ${isGerente ? '<th>Acciones</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${clientes.map(c => {
                const compras = ventas.filter(v => v.id_cliente === c.id);
                return `
                  <tr>
                    <td>#${c.id}</td>
                    <td><strong>${escapeHtml(c.nombre)}</strong></td>
                    <td>${escapeHtml(c.telefono)}</td>
                    <td>${escapeHtml(c.email)}</td>
                    <td>
                      <span style="font-size: 12px; color: var(--color-muted-gray);">${compras.length} órdenes registradas</span>
                    </td>
                    ${isGerente ? `
                      <td>
                        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="editClient(${c.id})">Editar</button>
                        <button class="btn-pill btn-pill-danger btn-pill-sm" onclick="deleteClient(${c.id})">Eliminar</button>
                      </td>
                    ` : ''}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    handleApiFailure(err, container, () => renderClientes(container));
  }
}

function openNewClientModal() {
  document.getElementById('client-create-form').reset();
  editingClientId = null;
  document.getElementById('client-modal-title').textContent = 'Registrar Cliente';
  document.getElementById('client-submit-btn').textContent = 'Guardar Cliente';
  document.getElementById('client-create-modal').classList.add('open');
  setTimeout(() => document.getElementById('client-create-nombre-input').focus(), 100);
}

function closeNewClientModal() {
  document.getElementById('client-create-modal').classList.remove('open');
  editingClientId = null;
}

function editClient(id) {
  const client = Store.clientes.find(item => item.id === id);
  if (!client) return;
  document.getElementById('client-create-nombre-input').value = client.nombre;
  document.getElementById('client-create-telefono-input').value = client.telefono === 'N/A' ? '' : client.telefono;
  document.getElementById('client-create-email-input').value = client.email;
  editingClientId = id;
  document.getElementById('client-modal-title').textContent = 'Editar Cliente';
  document.getElementById('client-submit-btn').textContent = 'Guardar Cambios';
  document.getElementById('client-create-modal').classList.add('open');
}

function deleteClient(id) {
  const client = Store.clientes.find(item => item.id === id);
  if (!client) return;
  showDeleteConfirmModal(client.nombre, 'al cliente', async () => {
    try {
      await Api.clientes.remove(id);
      showToast(`Cliente "${client.nombre}" eliminado.`);
      await renderClientes(document.getElementById('main-content'));
    } catch (err) {
      handleApiFailure(err, null, null);
    }
  });
}

async function handleNewClientSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('client-create-nombre-input').value.trim();
  const telefono = document.getElementById('client-create-telefono-input').value.trim() || 'N/A';
  const email = document.getElementById('client-create-email-input').value.trim().toLowerCase();

  if (!nombre || !email) {
    showToast('Nombre y correo electrónico son requeridos');
    return;
  }

  try {
    const wasEditing = Boolean(editingClientId);
    const saved = wasEditing
      ? await Api.clientes.update(editingClientId, { nombre, telefono, email })
      : await Api.clientes.create({ nombre, telefono, email });
    closeNewClientModal();
    showToast(`Cliente "${saved.nombre}" ${wasEditing ? 'actualizado' : 'registrado con éxito'}.`);
    await renderClientes(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

// ====================================================
// MÓDULO 7: ADMINISTRACIÓN & AUDITORÍA (/admin)
// ====================================================
async function renderAdmin(container) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    renderErrorState(container, 'Acceso Restringido', 'Solo el Gerente puede acceder al panel administrativo.', null);
    return;
  }
  renderLoadingState(container, 'Cargando personal y auditoría...');

  try {
    const [empleados, ventas] = await Promise.all([
      Api.empleados.list(),
      Api.ventas.list()
    ]);
    Store.empleados = empleados;
    Store.ventas = ventas;

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="section-title">Administración y Auditoría</h1>
          <p class="section-subtitle">Gestión de personal y trazabilidad histórica de transacciones</p>
        </div>
      </div>

      <div class="data-card" style="margin-bottom: 32px;">
        <div class="section-header" style="margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600;">Personal de la Tienda (Empleados)</h3>
          <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="addNewEmployeePrompt()">+ Dar de Alta Empleado</button>
        </div>
        <div class="table-responsive">
          <table class="clean-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Puesto / Rol</th>
                <th>Fecha de Ingreso</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${empleados.map(emp => `
                <tr>
                  <td>#${emp.id}</td>
                  <td><strong>${escapeHtml(emp.nombre)}</strong></td>
                  <td>${escapeHtml(emp.email)}</td>
                  <td><span class="card-badge badge-success" style="position: static;">${escapeHtml(emp.puesto)}</span></td>
                  <td>${escapeHtml(formatDateShort(emp.fecha_ingreso))}</td>
                  <td>
                    <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="changeEmployeeRole(${emp.id})" ${emp.puesto === 'Gerente' ? 'disabled title="No se puede cambiar el puesto de un gerente a empleado"' : ''}>
                      ${emp.puesto === 'Gerente' ? 'Gerente protegido' : 'Cambiar Puesto'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="data-card">
        <div class="section-header" style="margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600;">Auditoría Histórica de Ventas (Transacciones)</h3>
        </div>
        <div class="table-responsive">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Empleado Responsable</th>
                <th>Fecha y Hora</th>
                <th>Total Facturado</th>
                <th>Auditar Desglose</th>
              </tr>
            </thead>
            <tbody>
              ${ventas.map(v => `
                <tr>
                  <td><strong>${escapeHtml(v.folio)}</strong></td>
                  <td>${escapeHtml(v.cliente_nombre)}</td>
                  <td>${escapeHtml(v.empleado_nombre)}</td>
                  <td>${escapeHtml(formatDateTime(v.fecha_hora))}</td>
                  <td><strong>$${Number(v.total).toLocaleString()}</strong></td>
                  <td>
                    <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="showTicketModal(${v.id})">Ver Folio Completo</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    handleApiFailure(err, container, () => renderAdmin(container));
  }
}

function addNewEmployeePrompt() {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede dar de alta empleados');
    return;
  }
  document.getElementById('employee-form').reset();
  document.getElementById('employee-fecha-input').value = new Date().toISOString().substring(0, 10);
  document.getElementById('employee-modal').classList.add('open');
  setTimeout(() => document.getElementById('employee-nombre-input').focus(), 100);
}

function closeEmployeeModal() {
  document.getElementById('employee-modal').classList.remove('open');
}

async function handleEmployeeSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('employee-nombre-input').value.trim();
  const puesto = document.getElementById('employee-puesto-input').value;
  const email = document.getElementById('employee-email-input').value.trim().toLowerCase();
  const password = document.getElementById('employee-password-input').value;
  const fecha_ingreso = document.getElementById('employee-fecha-input').value;

  if (!nombre || !email || !password || password.length < 6 || !fecha_ingreso) {
    showToast('Completa todos los campos requeridos (contraseña mínima 6 caracteres)');
    return;
  }

  try {
    const created = await Api.empleados.create({ nombre, puesto, email, password, fecha_ingreso });
    closeEmployeeModal();
    showToast(`Empleado "${created.nombre}" dado de alta como ${created.puesto}`);
    await renderAdmin(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

function changeEmployeeRole(empId) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede cambiar puestos');
    return;
  }

  const emp = Store.empleados.find(e => e.id === empId);
  if (!emp) {
    showToast('No se encontró el empleado seleccionado');
    return;
  }
  if (emp.puesto === 'Gerente') {
    showToast('No se puede cambiar el puesto de un gerente a empleado');
    return;
  }

  pendingEmployeeRoleChangeId = emp.id;
  document.getElementById('employee-role-name').textContent =
    `${emp.nombre} · Puesto actual: ${emp.puesto}`;
  const roleSelect = document.getElementById('employee-role-select');
  roleSelect.value = emp.puesto;
  roleSelect.querySelector('option[value="Empleado"]').disabled = emp.puesto === 'Gerente';
  document.getElementById('employee-role-modal').classList.add('open');
  setTimeout(() => roleSelect.focus(), 100);
}

function closeEmployeeRoleModal() {
  document.getElementById('employee-role-modal').classList.remove('open');
  pendingEmployeeRoleChangeId = null;
}

function handleEmployeeRoleSubmit(e) {
  e.preventDefault();
  const emp = Store.empleados.find(e => e.id === pendingEmployeeRoleChangeId);
  const nuevoPuesto = document.getElementById('employee-role-select').value;
  if (!emp) {
    closeEmployeeRoleModal();
    showToast('No se encontró el empleado seleccionado');
    return;
  }
  if (emp.puesto === 'Gerente' && nuevoPuesto === 'Empleado') {
    showToast('No se puede cambiar el puesto de un gerente a empleado');
    return;
  }
  if (emp.puesto === nuevoPuesto) {
    closeEmployeeRoleModal();
    return;
  }
  if (emp.puesto !== 'Empleado' || nuevoPuesto !== 'Gerente') {
    showToast('El cambio de puesto seleccionado no es válido');
    return;
  }

  document.getElementById('employee-role-confirm-body').textContent =
    `¿Confirmas que deseas cambiar el puesto de ${emp.nombre} de Empleado a Gerente? Tendrá permisos administrativos.`;
  document.getElementById('employee-role-modal').classList.remove('open');
  document.getElementById('employee-role-confirm-modal').classList.add('open');
}

function closeEmployeeRoleConfirmModal() {
  document.getElementById('employee-role-confirm-modal').classList.remove('open');
  pendingEmployeeRoleChangeId = null;
}

async function confirmEmployeeRoleChange() {
  const emp = Store.empleados.find(e => e.id === pendingEmployeeRoleChangeId);
  if (!emp || emp.puesto !== 'Empleado') {
    closeEmployeeRoleConfirmModal();
    showToast('El cambio de puesto ya no es válido');
    return;
  }

  try {
    await Api.empleados.update(emp.id, { puesto: 'Gerente' });
    closeEmployeeRoleConfirmModal();
    showToast(`Puesto de ${emp.nombre} actualizado a: Gerente`);
    await renderAdmin(document.getElementById('main-content'));
  } catch (err) {
    handleApiFailure(err, null, null);
  }
}

// ====================================================
// MODAL DE AUDITORÍA DE TICKET
// ====================================================
async function showTicketModal(ventaId) {
  const modal = document.getElementById('ticket-modal');
  const details = document.getElementById('ticket-modal-details');
  details.innerHTML = '<p style="font-size: 14px; color: var(--color-muted-gray);">Cargando desglose...</p>';
  modal.classList.add('open');

  try {
    const venta = await Api.ventas.get(ventaId);
    details.innerHTML = `
      <div style="border-bottom: 1px dashed var(--color-faint-border); padding-bottom: 12px; margin-bottom: 12px;">
        <p style="font-size: 14px; margin-bottom: 4px;"><strong>Folio:</strong> ${escapeHtml(venta.folio)}</p>
        <p style="font-size: 14px; margin-bottom: 4px;"><strong>Fecha:</strong> ${escapeHtml(formatDateTime(venta.fecha_hora))}</p>
        <p style="font-size: 14px; margin-bottom: 4px;"><strong>Cliente:</strong> ${escapeHtml(venta.cliente_nombre)}</p>
        <p style="font-size: 14px;"><strong>Atendió:</strong> ${escapeHtml(venta.empleado_nombre)}</p>
      </div>

      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Líneas del Folio:</h4>
        ${(venta.items || []).map(it => `
          <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0;">
            <span>${it.cantidad}x ${escapeHtml(it.nombre)}</span>
            <strong>$${((moneyToCents(it.precio) * it.cantidad) / 100).toLocaleString()}</strong>
          </div>
        `).join('')}
      </div>

      <div style="border-top: 1px solid var(--color-faint-border); padding-top: 12px; display: flex; justify-content: space-between; font-size: 18px; font-weight: 600;">
        <span>Total Liquidado</span>
        <span>$${Number(venta.total).toLocaleString()}</span>
      </div>
    `;
  } catch (err) {
    details.innerHTML = `<p style="color: #991b1b; font-size: 14px;">${escapeHtml(err.message)}</p>`;
  }
}

function closeTicketModal() {
  document.getElementById('ticket-modal').classList.remove('open');
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Exportación al objeto window
window.navigate = navigate;
window.logout = logout;
window.switchLoginTab = switchLoginTab;
window.handleLoginSubmit = handleLoginSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.openPetDetail = openPetDetail;
window.openProductDetail = openProductDetail;
window.closeDetailModal = closeDetailModal;
window.showDeleteConfirmModal = showDeleteConfirmModal;
window.closeDeleteConfirmModal = closeDeleteConfirmModal;
window.confirmDeletePet = confirmDeletePet;
window.confirmDeleteProduct = confirmDeleteProduct;
window.selectPaymentMethod = selectPaymentMethod;
window.closeSaleConfirmModal = closeSaleConfirmModal;
window.processConfirmedSale = processConfirmedSale;
window.addProdToPOS = addProdToPOS;
window.addPetToPOS = addPetToPOS;
window.updateQty = updateQty;
window.removeCartItem = removeCartItem;
window.finalizeSale = finalizeSale;
window.switchPOSTab = switchPOSTab;
window.changePOSClient = changePOSClient;
window.changePetStatus = changePetStatus;
window.openStockModal = openStockModal;
window.closeProductStockModal = closeProductStockModal;
window.handleProductStockSubmit = handleProductStockSubmit;
window.editProductPrice = editProductPrice;
window.closeProductPriceModal = closeProductPriceModal;
window.handleProductPriceSubmit = handleProductPriceSubmit;
window.addNewEmployeePrompt = addNewEmployeePrompt;
window.closeEmployeeModal = closeEmployeeModal;
window.handleEmployeeSubmit = handleEmployeeSubmit;
window.closeEmployeeRoleModal = closeEmployeeRoleModal;
window.handleEmployeeRoleSubmit = handleEmployeeRoleSubmit;
window.openNewPetModal = openNewPetModal;
window.openEditPetModal = openEditPetModal;
window.closePetModal = closePetModal;
window.handlePetEspecieChange = handlePetEspecieChange;
window.handlePetSubmit = handlePetSubmit;
window.openNewProductModal = openNewProductModal;
window.openEditProductModal = openEditProductModal;
window.closeNewProductModal = closeNewProductModal;
window.handleNewProductSubmit = handleNewProductSubmit;
window.openNewClientModal = openNewClientModal;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.closeNewClientModal = closeNewClientModal;
window.handleNewClientSubmit = handleNewClientSubmit;
window.openSpeciesModal = openSpeciesModal;
window.editSpecies = editSpecies;
window.deleteSpecies = deleteSpecies;
window.closeSpeciesModal = closeSpeciesModal;
window.handleSpeciesSubmit = handleSpeciesSubmit;
window.openBreedModal = openBreedModal;
window.editBreed = editBreed;
window.deleteBreed = deleteBreed;
window.closeBreedModal = closeBreedModal;
window.handleBreedSubmit = handleBreedSubmit;
window.openCategoryModal = openCategoryModal;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.closeCategoryModal = closeCategoryModal;
window.handleCategorySubmit = handleCategorySubmit;
window.openProviderModal = openProviderModal;
window.editProvider = editProvider;
window.deleteProvider = deleteProvider;
window.closeProviderModal = closeProviderModal;
window.handleProviderSubmit = handleProviderSubmit;
window.changeEmployeeRole = changeEmployeeRole;
window.closeEmployeeRoleConfirmModal = closeEmployeeRoleConfirmModal;
window.confirmEmployeeRoleChange = confirmEmployeeRoleChange;
window.showTicketModal = showTicketModal;
window.closeTicketModal = closeTicketModal;
window.handleLiveSearch = handleLiveSearch;
window.filterEscaparate = filterEscaparate;
window.resetSearch = resetSearch;
