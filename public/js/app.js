/**
 * App Logic & Dynamic Module Rendering
 * Implementación de los módulos y especificaciones de AGENTS.md
 * - Live Search en Escaparate
 * - Detalle público/interno de productos y mascotas (sin exponer costos internos ni proveedores)
 * - Confirmación obligatoria para eliminaciones administrativas
 * - Resumen y confirmación de venta POS con método de pago
 * - Restricciones del rol empleado
 */

let currentView = 'escaparate'; // 'escaparate', 'dashboard', 'pos', 'mascotas', 'productos', 'catalogos', 'clientes', 'admin', 'login'
let posTab = 'productos'; // 'productos' | 'mascotas'
let loginTab = 'login'; // 'login' | 'register'
let currentSearch = '';
let currentFilterCategory = 'all';

// Estado para flujo de eliminación
let pendingDeleteAction = null;

// Estado para método de pago en confirmación POS
let selectedPaymentMethod = 'Efectivo';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupEventListeners();
  updateNavbarSession();
  updateSidebarVisibility();
  navigate('escaparate');
}

// Control de Sesión y Autenticación (AGENTS.md Sección 3 & 5)
function updateNavbarSession() {
  const container = document.getElementById('nav-session-container');
  if (!container) return;

  if (Store.currentUser) {
    const roleBadge = Store.currentUser.puesto;
    
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="user-session-chip">
          <span><strong>${Store.currentUser.nombre}</strong> <span class="role-tag">· ${roleBadge}</span></span>
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

// Control de Barra Lateral según Rol (AGENTS.md Sección 3.B)
function updateSidebarVisibility() {
  const sidebar = document.getElementById('app-sidebar-rail');
  if (!sidebar) return;

  const user = Store.currentUser;
  // Solo se renderiza cuando el usuario es Empleado o Gerente y no está en /login
  const isInternalStaff = user && (user.puesto === 'Gerente' || user.puesto === 'Empleado');
  const showSidebar = isInternalStaff && currentView !== 'login';

  sidebar.classList.toggle('hidden', !showSidebar);

  if (showSidebar) {
    const isGerente = user.puesto === 'Gerente';
    // Oculta automáticamente Catálogos Maestros y Administración/Auditoría cuando es Empleado
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

function clearActiveCart() {
  Store.cart.items = [];
}

function loginUser(userObj) {
  // Al iniciar sesión o cambiar entre sesiones, vaciar el carrito activo (AGENTS.md Sección 4.B)
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

function logout() {
  // Cerrar sesión también debe limpiar el carrito activo (AGENTS.md Sección 4.B)
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
    confirmDeleteBtn.addEventListener('click', () => {
      if (typeof pendingDeleteAction === 'function') {
        pendingDeleteAction();
      }
      closeDeleteConfirmModal();
    });
  }

  // AGENTS.md Sección 4.D: Cierre de modales con tecla Esc y clic fuera del cuadro
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeAllModals();
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      // Si el clic ocurrió directamente sobre el fondo oscuro (fuera del modal-box)
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
}

function navigate(view) {
  const user = Store.currentUser;
  const isInternal = user && (user.puesto === 'Gerente' || user.puesto === 'Empleado');
  const isGerente = user && user.puesto === 'Gerente';

  // Restricciones de rutas según roles
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

/* ====================================================
   MÓDULO 0: AUTENTICACIÓN, REGISTRO & SIMULADOR (/login)
==================================================== */
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

        ${loginTab === 'login' ? renderLoginForm() : renderRegisterForm()}

        ${Store.ENABLE_ROLE_SIMULATOR ? `
          <div class="login-simulator-box">
            <div class="login-simulator-title">Simulación Rápida de Roles (Entorno de Pruebas)</div>
            <div class="simulator-btns-grid">
              <button class="simulator-btn" onclick="quickLoginRole('Gerente')">
                <span>👑 <strong>Entrar como Gerente</strong></span>
                <span class="badge-sub">Valeria Ramos → Dashboard</span>
              </button>
              <button class="simulator-btn" onclick="quickLoginRole('Empleado')">
                <span>💳 <strong>Entrar como Empleado</strong></span>
                <span class="badge-sub">Eduardo Lozano → POS</span>
              </button>
              <button class="simulator-btn" onclick="quickLoginRole('Cliente')">
                <span>👤 <strong>Entrar como Cliente</strong></span>
                <span class="badge-sub">Carlos Mendoza → Escaparate</span>
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function switchLoginTab(tab) {
  loginTab = tab;
  renderLogin(document.getElementById('main-content'));
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

      <button type="submit" class="btn-pill btn-pill-primary" style="width: 100%; justify-content: center; margin-top: 8px;">
        Entrar a mi Cuenta
      </button>

      <div style="font-size: 11px; color: var(--color-muted-gray); text-align: center; margin-top: 14px;">
        Usuarios de prueba: <em>valeria@tienda.com</em> (Gerente), <em>eduardo@tienda.com</em> (Empleado) o <em>carlos.m@gmail.com</em> (Cliente). Pass: <em>123</em>
      </div>
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
        <input type="password" id="reg-password" class="form-input" placeholder="Mínimo 6 caracteres" required>
      </div>

      <button type="submit" class="btn-pill btn-pill-primary" style="width: 100%; justify-content: center; margin-top: 8px;">
        Crear Cuenta de Cliente
      </button>
    </form>
  `;
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-password').value;

  const emp = Store.empleados.find(e => e.email.toLowerCase() === email && e.password === pass);
  if (emp) {
    loginUser({
      id: emp.id,
      nombre: emp.nombre,
      puesto: emp.puesto,
      email: emp.email,
      tipo: 'empleado'
    });
    return;
  }

  const cli = Store.clientes.find(c => c.email.toLowerCase() === email && c.password === pass);
  if (cli) {
    loginUser({
      id: cli.id,
      nombre: cli.nombre,
      puesto: 'Cliente',
      email: cli.email,
      tipo: 'cliente'
    });
    return;
  }

  showToast('Credenciales incorrectas. Verifica tu correo y contraseña');
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value.trim();
  const telefono = document.getElementById('reg-telefono').value.trim() || 'N/A';
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass = document.getElementById('reg-password').value;

  const existsCli = Store.clientes.some(c => c.email.toLowerCase() === email);
  const existsEmp = Store.empleados.some(e => e.email.toLowerCase() === email);
  if (existsCli || existsEmp) {
    showToast('El correo ya se encuentra registrado');
    return;
  }

  const newCliente = {
    id: Store.clientes.length + 1,
    nombre,
    telefono,
    email,
    password: pass
  };

  Store.clientes.push(newCliente);
  showToast('¡Registro exitoso! Iniciando sesión...');

  loginUser({
    id: newCliente.id,
    nombre: newCliente.nombre,
    puesto: 'Cliente',
    email: newCliente.email,
    tipo: 'cliente'
  });
}

function quickLoginRole(role) {
  if (role === 'Gerente') {
    const emp = Store.empleados.find(e => e.puesto === 'Gerente') || Store.empleados[0];
    loginUser({
      id: emp.id,
      nombre: emp.nombre,
      puesto: 'Gerente',
      email: emp.email,
      tipo: 'empleado'
    });
  } else if (role === 'Empleado') {
    const emp = Store.empleados.find(e => e.puesto === 'Empleado') || Store.empleados[1];
    loginUser({
      id: emp.id,
      nombre: emp.nombre,
      puesto: 'Empleado',
      email: emp.email,
      tipo: 'empleado'
    });
  } else if (role === 'Cliente') {
    const cli = Store.clientes[1] || Store.clientes[0];
    loginUser({
      id: cli.id,
      nombre: cli.nombre,
      puesto: 'Cliente',
      email: cli.email,
      tipo: 'cliente'
    });
  }
}

// Modal de Contacto
function openContactModal() {
  document.getElementById('contact-modal').classList.add('open');
}

function closeContactModal() {
  document.getElementById('contact-modal').classList.remove('open');
}

/* ====================================================
   MÓDULO 4.A: LIVE SEARCH & ESCAPARATE PÚBLICO
   - Filtrado en tiempo real sin presionar enter o botón.
   - Conserva mascotas con estado = 'Disponible' y productos con stock > 0.
   - Coincide nombre/raza en mascotas y nombre/categoría en productos.
   - Muestra estado vacío si no hay coincidencias.
==================================================== */
function renderEscaparate(container) {
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
            value="${currentSearch}" 
            oninput="handleLiveSearch(this.value)"
            autocomplete="off"
          >
        </div>
      </div>

      <div class="categories-rail">
        <button class="category-chip ${currentFilterCategory === 'all' ? 'active' : ''}" onclick="filterEscaparate('all')">Todos</button>
        <button class="category-chip ${currentFilterCategory === 'Canino' ? 'active' : ''}" onclick="filterEscaparate('Canino')">🐶 Caninos</button>
        <button class="category-chip ${currentFilterCategory === 'Felino' ? 'active' : ''}" onclick="filterEscaparate('Felino')">🐱 Felinos</button>
        <button class="category-chip ${currentFilterCategory === 'Ave' ? 'active' : ''}" onclick="filterEscaparate('Ave')">🦜 Aves</button>
        <button class="category-chip ${currentFilterCategory === 'Productos' ? 'active' : ''}" onclick="filterEscaparate('Productos')">🛍️ Artículos & Alimentos</button>
      </div>
    </section>

    <!-- Contenedor Reactivo de Resultados del Escaparate -->
    <div id="escaparate-results-container">
      ${renderEscaparateResultsHTML(isInternal)}
    </div>
  `;
}

function handleLiveSearch(query) {
  currentSearch = query.trim().toLowerCase();
  const resultsContainer = document.getElementById('escaparate-results-container');
  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');
  if (resultsContainer) {
    resultsContainer.innerHTML = renderEscaparateResultsHTML(isInternal);
  }
}

function triggerSearch() {
  const input = document.getElementById('escaparate-search');
  if (input) {
    handleLiveSearch(input.value);
  }
}

function filterEscaparate(category) {
  currentFilterCategory = category;
  document.querySelectorAll('.categories-rail .category-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  if (event && event.target) {
    event.target.classList.add('active');
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

  // Filtrado estricto público: estado = 'Disponible'
  let filteredPets = Store.mascotas.filter(m => m.estado === 'Disponible');
  if (cat !== 'all') {
    if (cat === 'Productos') {
      filteredPets = [];
    } else {
      filteredPets = filteredPets.filter(m => m.especie === cat);
    }
  }
  if (q) {
    filteredPets = filteredPets.filter(m => 
      m.raza_nombre.toLowerCase().includes(q) || 
      m.especie.toLowerCase().includes(q)
    );
  }

  // Filtrado estricto público: stock > 0
  let filteredProds = Store.productos.filter(p => p.stock > 0);
  if (cat !== 'all') {
    if (cat !== 'Productos') {
      filteredProds = [];
    }
  }
  if (q) {
    filteredProds = filteredProds.filter(p => 
      p.nombre.toLowerCase().includes(q) || 
      p.categoria_nombre.toLowerCase().includes(q)
    );
  }

  const noResults = filteredPets.length === 0 && filteredProds.length === 0;

  if (noResults) {
    return `
      <div class="empty-state-box">
        <div class="empty-state-icon">🔍</div>
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">No se encontraron resultados</h3>
        <p style="font-size: 14px;">No encontramos mascotas o productos disponibles que coincidan con "<strong>${currentSearch}</strong>".</p>
        <button class="btn-pill btn-pill-secondary btn-pill-sm" style="margin-top: 16px;" onclick="resetSearch()">Limpiar búsqueda</button>
      </div>
    `;
  }

  let html = '';

  // Sección Mascotas
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
          <div class="product-card" onclick="openPetDetail(${pet.id})" style="cursor: pointer;">
            <div class="card-image-wrap">
              <img src="${pet.imagen}" alt="${pet.raza_nombre}">
              <span class="card-badge badge-success">Disponible</span>
            </div>
            <div class="card-content">
              <div>
                <div class="card-title">${pet.raza_nombre}</div>
                <div class="card-meta">${pet.especie} · Nacimiento: ${pet.fecha_nacimiento}</div>
              </div>
              <div class="card-footer-row" onclick="event.stopPropagation()">
                <span class="card-price">$${pet.precio.toLocaleString()}</span>
                <div style="display: flex; gap: 4px;">
                  <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openPetDetail(${pet.id})">Detalles</button>
                  ${isInternal ? `<button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addPetToPOS(${pet.id})">+ POS</button>` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Sección Productos
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
          <div class="product-card" onclick="openProductDetail(${prod.id})" style="cursor: pointer;">
            <div class="card-image-wrap">
              <img src="${prod.imagen}" alt="${prod.nombre}">
              ${prod.stock <= 5 ? `<span class="card-badge badge-warning">Últimas ${prod.stock} pzas</span>` : `<span class="card-badge badge-success">${prod.stock} en stock</span>`}
            </div>
            <div class="card-content">
              <div>
                <div class="card-title">${prod.nombre}</div>
                <div class="card-meta">${prod.categoria_nombre}</div>
              </div>
              <div class="card-footer-row" onclick="event.stopPropagation()">
                <span class="card-price">$${prod.precio.toLocaleString()}</span>
                <div style="display: flex; gap: 4px;">
                  <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openProductDetail(${prod.id})">Detalles</button>
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

/* ====================================================
   MÓDULO 4.B: CONSULTA DE DETALLES DE PRODUCTOS Y MASCOTAS
   - Detalle de mascota: raza, especie, fecha de nacimiento, estado disponible y precio.
   - Detalle de producto: nombre, categoría, precio y stock disponible.
   - Sin proveedores ni costos internos en detalles públicos.
   - Acción clara de consulta/cierre; sin acciones de administración para clientes.
==================================================== */
function openPetDetail(petId) {
  const pet = Store.mascotas.find(m => m.id === petId);
  if (!pet) return;

  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');
  const modal = document.getElementById('detail-modal');
  const title = document.getElementById('detail-modal-title');
  const body = document.getElementById('detail-modal-body');
  const footer = document.getElementById('detail-modal-footer');

  title.textContent = `Detalles de la Mascota: ${pet.raza_nombre}`;

  body.innerHTML = `
    <div style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-inner-img); overflow: hidden; margin-bottom: 16px; background: #f0f0f0;">
      <img src="${pet.imagen}" alt="${pet.raza_nombre}" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <div style="background: var(--color-canvas-mist); padding: 14px 18px; border-radius: var(--radius-pills); margin-bottom: 16px;">
      <div class="detail-info-row">
        <span class="detail-label">Especie:</span>
        <span class="detail-value">${pet.especie}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">Raza:</span>
        <span class="detail-value">${pet.raza_nombre}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">Fecha de Nacimiento:</span>
        <span class="detail-value">${pet.fecha_nacimiento}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">Estado:</span>
        <span class="detail-value" style="color: ${pet.estado === 'Disponible' ? '#166534' : '#92400e'};">${pet.estado}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">Precio al Público:</span>
        <span class="detail-value" style="font-size: 18px; color: var(--color-shop-violet);">$${pet.precio.toLocaleString()}</span>
      </div>
      ${isInternal ? `
        <div class="detail-info-row" style="border-top: 1px dashed #d0d0d0; margin-top: 8px; padding-top: 8px;">
          <span class="detail-label">Control Interno:</span>
          <span class="detail-value" style="font-size: 12px; color: var(--color-muted-gray);">ID Registro #${pet.id}</span>
        </div>
      ` : ''}
    </div>
  `;

  footer.innerHTML = `
    <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="closeDetailModal()">Cerrar</button>
    ${isInternal && pet.estado === 'Disponible' ? `
      <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addPetToPOS(${pet.id}); closeDetailModal();">+ Agregar a Venta (POS)</button>
    ` : !isInternal ? `
      <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="showToast('Solicitud de información enviada a sucursal'); closeDetailModal();">Consultar Disponibilidad</button>
    ` : ''}
  `;

  modal.classList.add('open');
}

function openProductDetail(productId) {
  const prod = Store.productos.find(p => p.id === productId);
  if (!prod) return;

  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');
  const modal = document.getElementById('detail-modal');
  const title = document.getElementById('detail-modal-title');
  const body = document.getElementById('detail-modal-body');
  const footer = document.getElementById('detail-modal-footer');

  title.textContent = `Detalles del Producto`;

  body.innerHTML = `
    <div style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-inner-img); overflow: hidden; margin-bottom: 16px; background: #f0f0f0;">
      <img src="${prod.imagen}" alt="${prod.nombre}" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <div style="background: var(--color-canvas-mist); padding: 14px 18px; border-radius: var(--radius-pills); margin-bottom: 16px;">
      <div class="detail-info-row">
        <span class="detail-label">Producto:</span>
        <span class="detail-value">${prod.nombre}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">Categoría:</span>
        <span class="detail-value">${prod.categoria_nombre}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">Stock Disponible:</span>
        <span class="detail-value" style="color: ${prod.stock <= 5 ? '#991b1b' : '#166534'};">${prod.stock} unidades</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">Precio al Público:</span>
        <span class="detail-value" style="font-size: 18px; color: var(--color-shop-violet);">$${prod.precio.toLocaleString()}</span>
      </div>
      ${isInternal ? `
        <div class="detail-info-row" style="border-top: 1px dashed #d0d0d0; margin-top: 8px; padding-top: 8px;">
          <span class="detail-label">Control Interno:</span>
          <span class="detail-value" style="font-size: 12px; color: var(--color-muted-gray);">SKU #${prod.id}</span>
        </div>
      ` : ''}
    </div>
  `;

  footer.innerHTML = `
    <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="closeDetailModal()">Cerrar</button>
    ${isInternal && prod.stock > 0 ? `
      <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addProdToPOS(${prod.id}); closeDetailModal();">+ Agregar a Venta (POS)</button>
    ` : !isInternal ? `
      <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="showToast('Disponible en piso de venta'); closeDetailModal();">Ver en Tienda</button>
    ` : ''}
  `;

  modal.classList.add('open');
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.remove('open');
}

/* ====================================================
   MÓDULO 4.C: CONFIRMACIÓN PARA ELIMINACIÓN
   - Toda eliminación administrativa pasa por este popup.
   - Identifica con precisión el elemento a eliminar.
   - Opciones explícitas de Cancelar y Confirmar.
==================================================== */
function showDeleteConfirmModal(itemName, itemType, onConfirmCallback) {
  const modal = document.getElementById('delete-confirm-modal');
  const body = document.getElementById('delete-confirm-body');

  body.innerHTML = `
    ¿Estás seguro de que deseas eliminar permanentemente ${itemType} <strong>"${itemName}"</strong> del sistema?
    <br><br>
    <span style="font-size: 12px; color: var(--color-muted-gray);">Esta acción no se puede deshacer en este catálogo.</span>
  `;

  pendingDeleteAction = onConfirmCallback;
  modal.classList.add('open');
}

function closeDeleteConfirmModal() {
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) modal.classList.remove('open');
  pendingDeleteAction = null;
}

/* ====================================================
   MÓDULO 4.D: RESUMEN Y CONFIRMACIÓN DE VENTA EN EL POS
   - Muestra Subtotal, Total, Método de pago.
   - Requiere confirmación explícita para cerrar y resetear el carrito.
   - Cancelar mantiene el carrito intacto.
==================================================== */
function finalizeSale() {
  if (Store.cart.items.length === 0) return;

  const client = Store.clientes.find(c => c.id === Store.cart.clienteId) || Store.clientes[0];
  const subtotal = Store.cart.items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const total = subtotal;

  const modal = document.getElementById('sale-confirm-modal');
  const body = document.getElementById('sale-confirm-body');

  selectedPaymentMethod = 'Efectivo'; // Default

  body.innerHTML = `
    <div style="background: var(--color-canvas-mist); padding: 14px 18px; border-radius: var(--radius-pills); margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--color-muted-gray); margin-bottom: 8px;">
        <span>Cliente: <strong>${client.nombre}</strong></span>
        <span>Atiende: <strong>${Store.currentUser ? Store.currentUser.nombre : 'Empleado'}</strong></span>
      </div>
      <div style="max-height: 140px; overflow-y: auto; margin-bottom: 8px; border-top: 1px dashed var(--color-faint-border); padding-top: 8px;">
        ${Store.cart.items.map(it => `
          <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0;">
            <span>${it.cantidad}x ${it.nombre}</span>
            <span>$${(it.precio * it.cantidad).toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
      <div class="detail-info-row" style="border-top: 1px solid var(--color-faint-border); padding-top: 8px;">
        <span class="detail-label">Subtotal:</span>
        <span class="detail-value">$${subtotal.toLocaleString()}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label" style="font-size: 16px;">TOTAL A COBRAR:</span>
        <span class="detail-value" style="font-size: 20px; color: var(--color-shop-violet);">$${total.toLocaleString()}</span>
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

function processConfirmedSale() {
  const client = Store.clientes.find(c => c.id === Store.cart.clienteId) || Store.clientes[0];
  const subtotal = Store.cart.items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const total = subtotal;

  // 1. Descontar stock de productos y marcar mascotas como Vendidas
  Store.cart.items.forEach(item => {
    if (item.tipo === 'producto') {
      const p = Store.productos.find(x => x.id === item.id);
      if (p) p.stock = Math.max(0, p.stock - item.cantidad);
    } else if (item.tipo === 'mascota') {
      const m = Store.mascotas.find(x => x.id === item.id);
      if (m) m.estado = 'Vendido';
    }
  });

  // 2. Crear registro de venta
  const newVenta = {
    id: 100 + Store.ventas.length + 1,
    folio: `V-2026-00${Store.ventas.length + 1}`,
    id_cliente: client.id,
    cliente_nombre: client.nombre,
    id_empleado: Store.currentUser ? Store.currentUser.id : 2,
    empleado_nombre: Store.currentUser ? Store.currentUser.nombre : 'Empleado',
    fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
    metodo_pago: selectedPaymentMethod,
    total: total,
    items: [...Store.cart.items]
  };

  Store.ventas.unshift(newVenta);
  Store.cart.items = []; // Limpiar carrito tras confirmación

  closeSaleConfirmModal();
  showToast(`¡Venta cerrada! Folio: ${newVenta.folio} (${selectedPaymentMethod})`);
  renderPOS(document.getElementById('main-content'));
}

/* ==========================================
   MÓDULO 1: DASHBOARD PRINCIPAL (/dashboard)
========================================== */
function renderDashboard(container) {
  const dispPets = Store.mascotas.filter(m => m.estado === 'Disponible').length;
  const quarPets = Store.mascotas.filter(m => m.estado === 'Cuarentena').length;
  const lowStockProds = Store.productos.filter(p => p.stock <= 5);
  const totalVentasHoy = Store.ventas.reduce((acc, v) => acc + v.total, 0);

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Dashboard General</h1>
        <p class="section-subtitle">Métricas en tiempo real y estado operativo</p>
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

    <!-- KPI Cards Grid -->
    <div class="cards-grid-3" style="margin-bottom: 32px;">
      <div class="product-card" style="padding: 24px;">
        <div class="card-meta">VENTAS REGISTRADAS HOY</div>
        <div style="font-size: 32px; font-weight: 600; letter-spacing: -0.05em; margin: 8px 0;">
          $${totalVentasHoy.toLocaleString()}
        </div>
        <div style="font-size: 12px; color: #166534; font-weight: 500;">
          + ${Store.ventas.length} transacciones cerradas
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

    <!-- Alertas Stock Crítico -->
    ${lowStockProds.length > 0 ? `
      <div class="data-card" style="margin-bottom: 32px; border-left: 4px solid #ef4444;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 16px; font-weight: 600;">⚠️ Alerta de Inventario Crítico</h3>
          ${Store.currentUser && Store.currentUser.puesto === 'Gerente' ? `<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="navigate('productos')">Reabastecer</button>` : ''}
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          ${lowStockProds.map(p => `
            <div style="background: #fef2f2; padding: 8px 16px; border-radius: 9999px; font-size: 13px; color: #991b1b; font-weight: 500;">
              ${p.nombre}: <strong>${p.stock} unidades</strong>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Últimas Transacciones (solo las últimas 5) -->
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
            ${Store.ventas.slice(0, 5).map(v => `
              <tr>
                <td><strong>${v.folio}</strong></td>
                <td>${v.cliente_nombre}</td>
                <td>${v.empleado_nombre}</td>
                <td>${v.fecha}</td>
                <td><strong>$${v.total.toLocaleString()}</strong></td>
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
}

/* ==========================================
   MÓDULO 2: PUNTO DE VENTA (POS) - (/ventas/nueva)
========================================== */
function renderPOS(container) {
  const dispPets = Store.mascotas.filter(m => m.estado === 'Disponible');
  const dispProds = Store.productos.filter(p => p.stock > 0);
  const selectedClient = Store.clientes.find(c => c.id === Store.cart.clienteId) || Store.clientes[0];

  const subtotal = Store.cart.items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const total = subtotal;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Terminal Punto de Venta (POS)</h1>
        <p class="section-subtitle">Cobro ágil en mostrador con unificación de catálogo y mascotas</p>
      </div>
      <div class="user-session-chip">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
        Caja Lista · Folio Activo: V-2026-00${Store.ventas.length + 1}
      </div>
    </div>

    <div class="pos-container">
      <!-- Panel Izquierdo: Selector de Catálogo -->
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
                  <img src="${prod.imagen}" alt="${prod.nombre}">
                  <span class="card-badge badge-success">Stock: ${prod.stock}</span>
                </div>
                <div class="card-content">
                  <div class="card-title" style="font-size: 14px;">${prod.nombre}</div>
                  <div class="card-meta">${prod.categoria_nombre}</div>
                  <div class="card-footer-row">
                    <span class="card-price">$${prod.precio.toLocaleString()}</span>
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
                  <img src="${pet.imagen}" alt="${pet.raza_nombre}">
                  <span class="card-badge badge-success">Vivo Único</span>
                </div>
                <div class="card-content">
                  <div class="card-title" style="font-size: 14px;">${pet.raza_nombre}</div>
                  <div class="card-meta">${pet.especie} · Edad estimada: 4 meses</div>
                  <div class="card-footer-row">
                    <span class="card-price">$${pet.precio.toLocaleString()}</span>
                    <button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addPetToPOS(${pet.id})">+ Agregar</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Panel Derecho: Ticket Activo -->
      <div class="pos-ticket-panel">
        <div class="ticket-header">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 16px;">Ticket de Venta</strong>
            <span style="font-size: 12px; color: var(--color-muted-gray);">Atiende: ${Store.currentUser ? Store.currentUser.nombre : 'Empleado'}</span>
          </div>

          <div class="form-group" style="margin-bottom: 8px;">
            <label class="form-label">Cliente Receptor</label>
            <select class="form-select" onchange="changePOSClient(this.value)">
              ${Store.clientes.map(c => `
                <option value="${c.id}" ${c.id === Store.cart.clienteId ? 'selected' : ''}>
                  ${c.nombre}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Lista del Carrito -->
        <div class="ticket-cart-items">
          ${Store.cart.items.length === 0 ? `
            <div style="text-align: center; color: var(--color-muted-gray); padding: 40px 0; font-size: 14px;">
              El carrito está vacío.<br>Selecciona productos o mascotas para facturar.
            </div>
          ` : Store.cart.items.map((item, idx) => `
            <div class="cart-item-row">
              <div class="cart-item-info">
                <span class="cart-item-name">${item.nombre}</span>
                <span class="cart-item-sub">
                  ${item.tipo === 'mascota' ? '🐾 Mascota viva (Ítem Único)' : `$${item.precio.toLocaleString()} c/u`}
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
                  $${(item.precio * item.cantidad).toLocaleString()}
                </span>
                <button onclick="removeCartItem(${idx})" style="background: none; border: none; cursor: pointer; color: #991b1b; font-size: 16px;">×</button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Totales y Botón de Cobro -->
        <div class="ticket-totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>$${subtotal.toLocaleString()}</span>
          </div>
          <div class="total-row">
            <span>Impuestos (IVA 16% incl.)</span>
            <span>$${(subtotal * 0.16).toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL A COBRAR</span>
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
  renderPOS(document.getElementById('main-content'));
}

function changePOSClient(clientId) {
  Store.cart.clienteId = parseInt(clientId);
  renderPOS(document.getElementById('main-content'));
}

function addProdToPOS(prodId) {
  const prod = Store.productos.find(p => p.id === prodId);
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
      precio: prod.precio,
      cantidad: 1
    });
  }

  showToast(`Añadido: ${prod.nombre}`);
  if (currentView === 'pos') {
    renderPOS(document.getElementById('main-content'));
  }
}

function addPetToPOS(petId) {
  const pet = Store.mascotas.find(m => m.id === petId);
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
    precio: pet.precio,
    cantidad: 1
  });

  showToast(`Mascota añadida al ticket: ${pet.raza_nombre}`);
  if (currentView === 'pos') {
    renderPOS(document.getElementById('main-content'));
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
    } else if (newQty > prod.stock) {
      showToast('Límite de stock alcanzado');
    } else {
      item.cantidad = newQty;
    }
  }

  renderPOS(document.getElementById('main-content'));
}

function removeCartItem(index) {
  Store.cart.items.splice(index, 1);
  renderPOS(document.getElementById('main-content'));
}

/* ====================================================
   MÓDULO 3: GESTIÓN DE MASCOTAS (/mascotas)
   - Restricciones del rol empleado: Solo el Gerente puede crear, editar o eliminar.
   - El Empleado solo puede consultar detalles.
   - Eliminación con modal de confirmación obligatorio.
==================================================== */
function renderMascotas(container) {
  const isGerente = Store.currentUser && Store.currentUser.puesto === 'Gerente';

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
            ${Store.mascotas.map(pet => `
              <tr>
                <td>#${pet.id}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${pet.imagen}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;">
                    <strong>${pet.raza_nombre}</strong>
                  </div>
                </td>
                <td>${pet.especie}</td>
                <td>${pet.raza_nombre}</td>
                <td>${pet.fecha_nacimiento}</td>
                <td><strong>$${pet.precio.toLocaleString()}</strong></td>
                <td>
                  <span class="card-badge ${pet.estado === 'Disponible' ? 'badge-success' : pet.estado === 'Cuarentena' ? 'badge-warning' : 'badge-danger'}" style="position: static;">
                    ${pet.estado}
                  </span>
                </td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openPetDetail(${pet.id})">Detalle</button>
                    ${isGerente ? `
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
}

function changePetStatus(id, newStatus) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede cambiar estados');
    return;
  }
  const pet = Store.mascotas.find(m => m.id === id);
  if (pet) {
    pet.estado = newStatus;
    showToast(`Estado de mascota #${id} cambiado a: ${newStatus}`);
    renderMascotas(document.getElementById('main-content'));
  }
}

function confirmDeletePet(id) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede eliminar registros');
    return;
  }
  const pet = Store.mascotas.find(m => m.id === id);
  if (!pet) return;

  showDeleteConfirmModal(pet.raza_nombre, 'la mascota', () => {
    Store.mascotas = Store.mascotas.filter(m => m.id !== id);
    showToast(`Mascota "${pet.raza_nombre}" eliminada del catálogo.`);
    renderMascotas(document.getElementById('main-content'));
  });
}

/* ====================================================
   MÓDULO 4: INVENTARIO DE PRODUCTOS (/productos)
   - Restricciones del rol empleado: Solo el Gerente puede crear, editar stock, precio o eliminar.
   - Empleados tienen acceso de solo lectura / consulta de detalles.
   - Eliminación con modal de confirmación obligatorio.
==================================================== */
function renderProductos(container) {
  const isGerente = Store.currentUser && Store.currentUser.puesto === 'Gerente';

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
            ${Store.productos.map(p => `
              <tr>
                <td>#${p.id}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${p.imagen}" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover;">
                    <strong>${p.nombre}</strong>
                  </div>
                </td>
                <td>${p.categoria_nombre}</td>
                <td>
                  <span class="card-badge ${p.stock <= 5 ? 'badge-warning' : 'badge-success'}" style="position: static;">
                    ${p.stock} unidades
                  </span>
                </td>
                <td><strong>$${p.precio.toLocaleString()}</strong></td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openProductDetail(${p.id})">Detalle</button>
                    ${isGerente ? `
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
}

// Variable global para identificar el producto en edición modal
let editingProductId = null;

function openStockModal(productId) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede alterar el stock');
    return;
  }
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

function handleProductStockSubmit(e) {
  e.preventDefault();
  if (!editingProductId) return;
  const prod = Store.productos.find(p => p.id === editingProductId);
  if (!prod) return;

  const newStock = parseInt(document.getElementById('product-stock-input').value);
  if (isNaN(newStock) || newStock < 0) {
    showToast('Ingresa un valor de stock válido');
    return;
  }

  prod.stock = newStock;
  closeProductStockModal();
  showToast(`Stock de "${prod.nombre}" actualizado a ${newStock} unidades`);
  renderProductos(document.getElementById('main-content'));
}

function editProductPrice(productId) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede modificar precios');
    return;
  }
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

function handleProductPriceSubmit(e) {
  e.preventDefault();
  if (!editingProductId) return;
  const prod = Store.productos.find(p => p.id === editingProductId);
  if (!prod) return;

  const newPrice = parseFloat(document.getElementById('product-price-input').value);
  if (isNaN(newPrice) || newPrice <= 0) {
    showToast('Ingresa un precio válido');
    return;
  }

  prod.precio = newPrice;
  closeProductPriceModal();
  showToast(`Precio de "${prod.nombre}" actualizado a $${newPrice.toLocaleString()}`);
  renderProductos(document.getElementById('main-content'));
}

function confirmDeleteProduct(id) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede eliminar productos');
    return;
  }
  const prod = Store.productos.find(p => p.id === id);
  if (!prod) return;

  showDeleteConfirmModal(prod.nombre, 'el producto', () => {
    Store.productos = Store.productos.filter(p => p.id !== id);
    showToast(`Producto "${prod.nombre}" eliminado del catálogo.`);
    renderProductos(document.getElementById('main-content'));
  });
}

/* ==========================================
   MÓDULO 5: CATÁLOGOS MAESTROS (/catalogos)
========================================== */
function renderCatalogos(container) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    container.innerHTML = `<div class="data-card"><h2>Acceso Restringido</h2><p>Solo el Gerente puede administrar catálogos maestros.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Catálogos Maestros</h1>
        <p class="section-subtitle">Configuración estructural del sistema y parámetros maestros</p>
      </div>
    </div>

    <div class="cards-grid-3" style="margin-bottom: 24px;">
      <!-- Card Especies y Razas -->
      <div class="data-card">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Especies Registradas</h3>
        <ul style="list-style: none; margin-bottom: 16px;">
          ${Store.especies.map(e => `
            <li style="padding: 6px 0; border-bottom: 1px solid var(--color-faint-border); display: flex; justify-content: space-between;">
              <span>${e.nombre}</span>
              <span style="font-size: 12px; color: var(--color-muted-gray);">${Store.razas.filter(r => r.id_especie === e.id).length} razas</span>
            </li>
          `).join('')}
        </ul>
        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="addEspeciePrompt()">+ Nueva Especie</button>
      </div>

      <!-- Card Categorías de Productos -->
      <div class="data-card">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Categorías de Productos</h3>
        <ul style="list-style: none; margin-bottom: 16px;">
          ${Store.categorias.map(c => `
            <li style="padding: 6px 0; border-bottom: 1px solid var(--color-faint-border);">
              ${c.nombre}
            </li>
          `).join('')}
        </ul>
        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="addCategoriaPrompt()">+ Nueva Categoría</button>
      </div>

      <!-- Card Proveedores -->
      <div class="data-card">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Directorio de Proveedores</h3>
        <ul style="list-style: none; margin-bottom: 16px;">
          ${Store.proveedores.map(p => `
            <li style="padding: 6px 0; border-bottom: 1px solid var(--color-faint-border);">
              <strong>${p.nombre}</strong><br>
              <span style="font-size: 12px; color: var(--color-muted-gray);">${p.telefono} · ${p.email}</span>
            </li>
          `).join('')}
        </ul>
        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="addProveedorPrompt()">+ Alta Proveedor</button>
      </div>
    </div>
  `;
}

function addEspeciePrompt() {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') return;
  document.getElementById('species-form').reset();
  document.getElementById('species-modal').classList.add('open');
  setTimeout(() => document.getElementById('species-nombre-input').focus(), 100);
}

function addCategoriaPrompt() {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') return;
  document.getElementById('category-form').reset();
  document.getElementById('category-modal').classList.add('open');
  setTimeout(() => document.getElementById('category-nombre-input').focus(), 100);
}

function addProveedorPrompt() {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') return;
  document.getElementById('provider-form').reset();
  document.getElementById('provider-modal').classList.add('open');
  setTimeout(() => document.getElementById('provider-nombre-input').focus(), 100);
}

function closeSpeciesModal() {
  document.getElementById('species-modal').classList.remove('open');
}

function handleSpeciesSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('species-nombre-input').value.trim();
  if (!nombre) return;
  if (Store.especies.some(e => e.nombre.toLowerCase() === nombre.toLowerCase())) {
    showToast('Esta especie ya está registrada');
    return;
  }
  Store.especies.push({ id: Store.especies.length + 1, nombre });
  closeSpeciesModal();
  showToast(`Especie "${nombre}" agregada.`);
  renderCatalogos(document.getElementById('main-content'));
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('open');
}

function handleCategorySubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('category-nombre-input').value.trim();
  if (!nombre) return;
  if (Store.categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
    showToast('Esta categoría ya está registrada');
    return;
  }
  Store.categorias.push({ id: Store.categorias.length + 1, nombre });
  closeCategoryModal();
  showToast(`Categoría "${nombre}" creada.`);
  renderCatalogos(document.getElementById('main-content'));
}

function closeProviderModal() {
  document.getElementById('provider-modal').classList.remove('open');
}

function handleProviderSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('provider-nombre-input').value.trim();
  const telefono = document.getElementById('provider-telefono-input').value.trim();
  const email = document.getElementById('provider-email-input').value.trim().toLowerCase();
  if (!nombre || !telefono || !email) return;
  if (Store.proveedores.some(p => p.email.toLowerCase() === email)) {
    showToast('Este correo ya está registrado para otro proveedor');
    return;
  }
  Store.proveedores.push({
    id: Store.proveedores.length + 1,
    nombre,
    telefono,
    email
  });
  closeProviderModal();
  showToast(`Proveedor "${nombre}" registrado.`);
  renderCatalogos(document.getElementById('main-content'));
}

/* ==========================================
   MÓDULO 6: DIRECTORIO DE CLIENTES (/clientes)
========================================== */
function renderClientes(container) {
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
            </tr>
          </thead>
          <tbody>
            ${Store.clientes.map(c => {
              const compras = Store.ventas.filter(v => v.id_cliente === c.id);
              return `
                <tr>
                  <td>#${c.id}</td>
                  <td><strong>${c.nombre}</strong></td>
                  <td>${c.telefono}</td>
                  <td>${c.email}</td>
                  <td>
                    <span style="font-size: 12px; color: var(--color-muted-gray);">${compras.length} órdenes registradas</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openNewClientModal() {
  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Empleado');
  if (!isInternal) return;
  document.getElementById('client-form').reset();
  document.getElementById('client-password-input').value = '123';
  document.getElementById('client-modal').classList.add('open');
  setTimeout(() => document.getElementById('client-nombre-input').focus(), 100);
}

function closeClientModal() {
  document.getElementById('client-modal').classList.remove('open');
}

function handleClientSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('client-nombre-input').value.trim();
  const telefono = document.getElementById('client-telefono-input').value.trim() || 'N/A';
  const email = document.getElementById('client-email-input').value.trim().toLowerCase();
  const password = document.getElementById('client-password-input').value;
  if (!nombre || !email || !password) return;
  if (Store.clientes.some(c => c.email.toLowerCase() === email) || Store.empleados.some(emp => emp.email.toLowerCase() === email)) {
    showToast('El correo ya está registrado');
    return;
  }
  Store.clientes.push({
    id: Store.clientes.length + 1,
    nombre,
    telefono,
    email,
    password
  });
  closeClientModal();
  showToast(`Cliente "${nombre}" registrado con éxito.`);
  renderClientes(document.getElementById('main-content'));
}

/* ==========================================
   MÓDULO 7: ADMINISTRACIÓN & AUDITORÍA (/admin)
========================================== */
function renderAdmin(container) {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    container.innerHTML = `<div class="data-card"><h2>Acceso Restringido</h2><p>Solo el Gerente puede acceder al panel administrativo.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Administración y Auditoría</h1>
        <p class="section-subtitle">Gestión de personal y trazabilidad histórica de transacciones</p>
      </div>
    </div>

    <!-- Gestión de Empleados -->
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
              <th>Puesto / Rol</th>
              <th>Fecha de Ingreso</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${Store.empleados.map(emp => `
              <tr>
                <td>#${emp.id}</td>
                <td><strong>${emp.nombre}</strong></td>
                <td><span class="card-badge badge-success" style="position: static;">${emp.puesto}</span></td>
                <td>${emp.fecha_ingreso}</td>
                <td>
                  <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="changeEmployeeRole(${emp.id})">Cambiar Puesto</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Auditoría Histórica de Ventas -->
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
              <th>Método de Pago</th>
              <th>Fecha y Hora</th>
              <th>Total Facturado</th>
              <th>Auditar Desglose</th>
            </tr>
          </thead>
          <tbody>
            ${Store.ventas.map(v => `
              <tr>
                <td><strong>${v.folio}</strong></td>
                <td>${v.cliente_nombre}</td>
                <td>${v.empleado_nombre}</td>
                <td><span style="font-size: 12px; color: var(--color-muted-gray);">${v.metodo_pago || 'Efectivo'}</span></td>
                <td>${v.fecha}</td>
                <td><strong>$${v.total.toLocaleString()}</strong></td>
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

function handleEmployeeSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('employee-nombre-input').value.trim();
  const puesto = document.getElementById('employee-puesto-input').value;
  const email = document.getElementById('employee-email-input').value.trim().toLowerCase();
  const fecha_ingreso = document.getElementById('employee-fecha-input').value;

  if (!nombre || !email || !fecha_ingreso) {
    showToast('Por favor completa todos los campos requeridos');
    return;
  }

  // Validar si el email ya existe
  const existsEmp = Store.empleados.some(emp => emp.email.toLowerCase() === email);
  if (existsEmp) {
    showToast('El correo ya está registrado por otro empleado');
    return;
  }

  Store.empleados.push({
    id: Store.empleados.length + 1,
    nombre,
    puesto,
    email,
    password: '123',
    fecha_ingreso
  });

  closeEmployeeModal();
  showToast(`Empleado "${nombre}" dado de alta como ${puesto}`);
  renderAdmin(document.getElementById('main-content'));
}

function changeEmployeeRole(empId) {
  const emp = Store.empleados.find(e => e.id === empId);
  if (!emp) return;
  const nuevoPuesto = prompt(`Cambiar puesto de ${emp.nombre} ('Gerente', 'Empleado'):`, emp.puesto);
  if (nuevoPuesto) {
    emp.puesto = nuevoPuesto;
    showToast(`Puesto actualizado a: ${nuevoPuesto}`);
    renderAdmin(document.getElementById('main-content'));
  }
}

/* ==========================================
   MODAL DE AUDITORÍA DE TICKET
========================================== */
function showTicketModal(ventaId) {
  const venta = Store.ventas.find(v => v.id === ventaId);
  if (!venta) return;

  const modal = document.getElementById('ticket-modal');
  const details = document.getElementById('ticket-modal-details');

  details.innerHTML = `
    <div style="border-bottom: 1px dashed var(--color-faint-border); padding-bottom: 12px; margin-bottom: 12px;">
      <p style="font-size: 14px; margin-bottom: 4px;"><strong>Folio:</strong> ${venta.folio}</p>
      <p style="font-size: 14px; margin-bottom: 4px;"><strong>Fecha:</strong> ${venta.fecha}</p>
      <p style="font-size: 14px; margin-bottom: 4px;"><strong>Cliente:</strong> ${venta.cliente_nombre}</p>
      <p style="font-size: 14px; margin-bottom: 4px;"><strong>Atendió:</strong> ${venta.empleado_nombre}</p>
      <p style="font-size: 14px;"><strong>Método de Pago:</strong> ${venta.metodo_pago || 'Efectivo'}</p>
    </div>

    <div style="margin-bottom: 16px;">
      <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Líneas del Folio:</h4>
      ${venta.items.map(it => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0;">
          <span>${it.cantidad}x ${it.nombre}</span>
          <strong>$${(it.precio * it.cantidad).toLocaleString()}</strong>
        </div>
      `).join('')}
    </div>

    <div style="border-top: 1px solid var(--color-faint-border); padding-top: 12px; display: flex; justify-content: space-between; font-size: 18px; font-weight: 600;">
      <span>Total Liquidado</span>
      <span>$${venta.total.toLocaleString()}</span>
    </div>
  `;

  modal.classList.add('open');
}

function closeTicketModal() {
  document.getElementById('ticket-modal').classList.remove('open');
}

/* ==========================================
   MODALES DE ALTA (Solo Gerente)
========================================== */
function openNewPetModal() {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede dar de alta mascotas');
    return;
  }
  
  const especieSelect = document.getElementById('pet-especie-input');
  const proveedorSelect = document.getElementById('pet-proveedor-input');

  especieSelect.innerHTML = Store.especies.map(e => `<option value="${e.nombre}">${e.nombre}</option>`).join('');
  proveedorSelect.innerHTML = Store.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');

  handlePetEspecieChange(Store.especies[0] ? Store.especies[0].nombre : '');

  document.getElementById('pet-form').reset();
  document.getElementById('pet-fecha-input').value = new Date().toISOString().substring(0, 10);
  document.getElementById('pet-modal').classList.add('open');
}

function handlePetEspecieChange(especieNombre) {
  const razaSelect = document.getElementById('pet-raza-input');
  const especieObj = Store.especies.find(e => e.nombre === especieNombre);
  if (!especieObj) {
    razaSelect.innerHTML = '<option value="">Sin razas</option>';
    return;
  }
  const razasFiltradas = Store.razas.filter(r => r.id_especie === especieObj.id);
  razaSelect.innerHTML = razasFiltradas.map(r => `<option value="${r.nombre}">${r.nombre}</option>`).join('');
}

function closePetModal() {
  document.getElementById('pet-modal').classList.remove('open');
}

function handlePetSubmit(e) {
  e.preventDefault();
  const especie = document.getElementById('pet-especie-input').value;
  const raza = document.getElementById('pet-raza-input').value;
  const id_proveedor = parseInt(document.getElementById('pet-proveedor-input').value);
  const fecha_nacimiento = document.getElementById('pet-fecha-input').value;
  const precio = parseFloat(document.getElementById('pet-precio-input').value);
  const estado = document.getElementById('pet-estado-input').value;
  let imagen = document.getElementById('pet-imagen-input').value.trim();

  if (!raza || isNaN(precio) || precio <= 0 || !fecha_nacimiento) {
    showToast('Por favor completa los campos obligatorios válidos');
    return;
  }

  if (!imagen) {
    imagen = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';
  }

  const especieObj = Store.especies.find(e => e.nombre === especie);
  const razaObj = Store.razas.find(r => r.nombre === raza);

  Store.mascotas.push({
    id: Store.mascotas.length + 1,
    id_raza: razaObj ? razaObj.id : 1,
    raza_nombre: raza,
    especie: especie,
    id_proveedor: id_proveedor || 1,
    fecha_nacimiento: fecha_nacimiento,
    precio: precio,
    estado: estado || 'Disponible',
    imagen: imagen
  });

  closePetModal();
  showToast(`Mascota "${raza}" registrada en catálogo exitosamente.`);
  renderMascotas(document.getElementById('main-content'));
}

function openNewProductModal() {
  if (!Store.currentUser || Store.currentUser.puesto !== 'Gerente') {
    showToast('Acción no permitida: Solo el Gerente puede registrar productos');
    return;
  }
  document.getElementById('product-form').reset();
  const categoriaSelect = document.getElementById('product-categoria-input');
  const proveedorSelect = document.getElementById('product-proveedor-input');
  categoriaSelect.innerHTML = Store.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  proveedorSelect.innerHTML = Store.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
  document.getElementById('product-modal').classList.add('open');
  setTimeout(() => document.getElementById('product-nombre-input').focus(), 100);
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
}

function handleProductSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById('product-nombre-input').value.trim();
  const id_categoria = parseInt(document.getElementById('product-categoria-input').value);
  const id_proveedor = parseInt(document.getElementById('product-proveedor-input').value);
  const precio = parseFloat(document.getElementById('product-precio-input').value);
  const stock = parseInt(document.getElementById('product-stock-input-modal').value);
  let imagen = document.getElementById('product-imagen-input').value.trim();
  const categoria = Store.categorias.find(c => c.id === id_categoria);

  if (!nombre || isNaN(precio) || precio <= 0 || isNaN(stock) || stock < 0 || !categoria) {
    showToast('Por favor completa los campos obligatorios válidos');
    return;
  }
  if (!imagen) {
    imagen = 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=600&q=80';
  }
  Store.productos.push({
    id: Store.productos.length + 1,
    nombre,
    id_categoria,
    categoria_nombre: categoria.nombre,
    id_proveedor,
    precio,
    stock,
    imagen
  });
  closeProductModal();
  showToast(`Producto "${nombre}" registrado con éxito.`);
  renderProductos(document.getElementById('main-content'));
}

/* Utilería: Toast Notificaciones */
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
  }, 2800);
}

// Exportación al objeto window
window.navigate = navigate;
window.loginUser = loginUser;
window.logout = logout;
window.switchLoginTab = switchLoginTab;
window.handleLoginSubmit = handleLoginSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.quickLoginRole = quickLoginRole;
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
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
window.openNewPetModal = openNewPetModal;
window.closePetModal = closePetModal;
window.handlePetEspecieChange = handlePetEspecieChange;
window.handlePetSubmit = handlePetSubmit;
window.closeProductModal = closeProductModal;
window.handleProductSubmit = handleProductSubmit;
window.addEspeciePrompt = addEspeciePrompt;
window.closeSpeciesModal = closeSpeciesModal;
window.handleSpeciesSubmit = handleSpeciesSubmit;
window.addCategoriaPrompt = addCategoriaPrompt;
window.closeCategoryModal = closeCategoryModal;
window.handleCategorySubmit = handleCategorySubmit;
window.addProveedorPrompt = addProveedorPrompt;
window.closeProviderModal = closeProviderModal;
window.handleProviderSubmit = handleProviderSubmit;
window.openNewClientModal = openNewClientModal;
window.closeClientModal = closeClientModal;
window.handleClientSubmit = handleClientSubmit;
window.changeEmployeeRole = changeEmployeeRole;
window.showTicketModal = showTicketModal;
window.closeTicketModal = closeTicketModal;
window.openNewProductModal = openNewProductModal;
window.triggerSearch = triggerSearch;
window.handleLiveSearch = handleLiveSearch;
window.filterEscaparate = filterEscaparate;
window.resetSearch = resetSearch;
