/**
 * App Logic & Dynamic Module Rendering
 * Implementación de los módulos y especificaciones de AGENTS.md
 * Estilizado bajo los lineamientos y tokens de DESIGN.md
 */

let currentView = 'escaparate'; // 'escaparate', 'dashboard', 'pos', 'mascotas', 'productos', 'catalogos', 'clientes', 'admin', 'login'
let posTab = 'productos'; // 'productos' | 'mascotas'
let loginTab = 'login'; // 'login' | 'register'
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupEventListeners();
  updateNavbarSession();
  updateSidebarVisibility();
  navigate('escaparate');
}

// Control de Sesión y Autenticación (AGENTS.md Sección 3 & 4)
function updateNavbarSession() {
  const container = document.getElementById('nav-session-container');
  if (!container) return;

  if (Store.currentUser) {
    // Si HAY sesión activa: Indicador con nombre, rol y botón 'Cerrar Sesión'
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
    // Si NO hay sesión activa: Botón 'Iniciar Sesión / Registrarse'
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
  // La barra lateral se renderiza únicamente cuando el usuario es Cajero, Asesor o Gerente
  // y NO se muestra cuando se está en la vista /login
  const isInternalStaff = user && (user.puesto === 'Gerente' || user.puesto === 'Cajero' || user.puesto === 'Asesor');
  const showSidebar = isInternalStaff && currentView !== 'login';

  sidebar.classList.toggle('hidden', !showSidebar);

  if (showSidebar) {
    const isGerente = user.puesto === 'Gerente';
    // Oculta automáticamente Catálogos Maestros y Administración/Auditoría cuando es Cajero/Asesor
    const navCatalogos = document.getElementById('nav-catalogos');
    const navAdmin = document.getElementById('nav-admin');
    if (navCatalogos) navCatalogos.style.display = isGerente ? 'flex' : 'none';
    if (navAdmin) navAdmin.style.display = isGerente ? 'flex' : 'none';

    // Avatar
    const avatar = document.getElementById('user-avatar');
    if (avatar) {
      avatar.textContent = user.puesto.substring(0, 2).toUpperCase();
      avatar.title = `${user.nombre} (${user.puesto})`;
    }
  }
}

function loginUser(userObj) {
  Store.currentUser = userObj;
  updateNavbarSession();
  updateSidebarVisibility();
  showToast(`¡Bienvenido, ${userObj.nombre}!`);

  // Redirección según rol (AGENTS.md Sección 4.A)
  if (userObj.puesto === 'Gerente') {
    navigate('dashboard');
  } else if (userObj.puesto === 'Cajero' || userObj.puesto === 'Asesor') {
    navigate('pos');
  } else {
    navigate('escaparate');
  }
}

function logout() {
  Store.currentUser = null;
  updateNavbarSession();
  updateSidebarVisibility();
  showToast('Has cerrado sesión');
  navigate('escaparate');
}

function setupEventListeners() {
  // Navigation clicks en el sidebar rail
  document.querySelectorAll('.rail-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(btn.dataset.view);
    });
  });
}

function navigate(view) {
  // Si intenta acceder a rutas internas protegidas sin permiso
  const user = Store.currentUser;
  const isInternal = user && (user.puesto === 'Gerente' || user.puesto === 'Cajero' || user.puesto === 'Asesor');
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
  
  // Highlight active button in rail
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
   (AGENTS.md Sección 4: Vista dedicada sin sidebar, tarjeta central,
   pestañas Login y Registro, y panel de simulación de roles)
==================================================== */
function renderLogin(container) {
  container.innerHTML = `
    <div class="login-view-wrapper">
      <div class="login-card">
        <div class="login-card-header">
          <div class="login-brand-logo">shop<span class="violet-dot">.</span></div>
          <p class="section-subtitle">Acceso a plataforma y servicios</p>
        </div>

        <!-- Pestañas Iniciar Sesión / Registrarse -->
        <div class="login-tabs-nav">
          <button class="login-tab-btn ${loginTab === 'login' ? 'active' : ''}" onclick="switchLoginTab('login')">
            Iniciar Sesión
          </button>
          <button class="login-tab-btn ${loginTab === 'register' ? 'active' : ''}" onclick="switchLoginTab('register')">
            Registrarse
          </button>
        </div>

        ${loginTab === 'login' ? renderLoginForm() : renderRegisterForm()}

        <!-- Panel de Simulación Rápida de Roles (AGENTS.md Sección 4.C) -->
        ${Store.ENABLE_ROLE_SIMULATOR ? `
          <div class="login-simulator-box">
            <div class="login-simulator-title">Simulación Rápida de Roles (Entorno de Pruebas)</div>
            <div class="simulator-btns-grid">
              <button class="simulator-btn" onclick="quickLoginRole('Gerente')">
                <span>👑 <strong>Entrar como Gerente</strong></span>
                <span class="badge-sub">Valeria Ramos → Dashboard</span>
              </button>
              <button class="simulator-btn" onclick="quickLoginRole('Cajero')">
                <span>💳 <strong>Entrar como Cajero</strong></span>
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
        Usuarios de prueba precargados: <em>valeria@tienda.com</em> (Gerente), <em>eduardo@tienda.com</em> (Cajero) o <em>carlos.m@gmail.com</em> (Cliente). Pass: <em>123</em>
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

  // Verificar primero en empleados
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

  // Verificar en clientes
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

  // Verificar unicidad de email
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
  } else if (role === 'Cajero') {
    const emp = Store.empleados.find(e => e.puesto === 'Cajero') || Store.empleados[1];
    loginUser({
      id: emp.id,
      nombre: emp.nombre,
      puesto: 'Cajero',
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

// Modal de Contacto (AGENTS.md Sección 3.A)
function openContactModal() {
  document.getElementById('contact-modal').classList.add('open');
}

function closeContactModal() {
  document.getElementById('contact-modal').classList.remove('open');
}

/* ==========================================
   MÓDULO 0: ESCAPARATE PÚBLICO (LANDING)
   Diseño según DESIGN.md: Hero centrado, palabra 'shop.', 
   barra de búsqueda con botón circular violeta, chips de categorías
   y cuadrícula flotante de tarjetas 28px con soft shadow.
========================================== */
function renderEscaparate(container) {
  const dispPets = Store.mascotas.filter(m => m.estado === 'Disponible');
  const dispProds = Store.productos.filter(p => p.stock > 0);
  const isInternal = Store.currentUser && (Store.currentUser.puesto === 'Gerente' || Store.currentUser.puesto === 'Cajero');

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
          <input type="text" id="escaparate-search" placeholder="¿Qué estás buscando para tu mascota hoy?" value="${currentSearch}">
          <button class="btn-search-violet" onclick="triggerSearch()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div class="categories-rail">
        <button class="category-chip active" onclick="filterEscaparate('all')">Todos</button>
        <button class="category-chip" onclick="filterEscaparate('Canino')">🐶 Caninos</button>
        <button class="category-chip" onclick="filterEscaparate('Felino')">🐱 Felinos</button>
        <button class="category-chip" onclick="filterEscaparate('Ave')">🦜 Aves</button>
        <button class="category-chip" onclick="filterEscaparate('Productos')">🛍️ Artículos & Alimentos</button>
      </div>
    </section>

    <!-- Sección Mascotas Disponibles -->
    <div class="section-header">
      <div>
        <h2 class="section-title">
          Mascotas Disponibles
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </h2>
        <p class="section-subtitle">Listos para encontrar un nuevo hogar responsable</p>
      </div>
      ${isInternal ? `<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="navigate('mascotas')">Gestionar Catálogo</button>` : ''}
    </div>

    <div class="cards-grid-4" style="margin-bottom: 48px;">
      ${dispPets.map(pet => `
        <div class="product-card">
          <div class="card-image-wrap">
            <img src="${pet.imagen}" alt="${pet.raza_nombre}">
            <span class="card-badge badge-success">Disponible</span>
          </div>
          <div class="card-content">
            <div>
              <div class="card-title">${pet.raza_nombre}</div>
              <div class="card-meta">${pet.especie} · Nacimiento: ${pet.fecha_nacimiento}</div>
            </div>
            <div class="card-footer-row">
              <span class="card-price">$${pet.precio.toLocaleString()}</span>
              ${isInternal 
                ? `<button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addPetToPOS(${pet.id})">+ POS</button>`
                : `<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="showToast('Solicitud de informe enviada a la sucursal')">Consultar</button>`
              }
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Sección Productos Físicos -->
    <div class="section-header">
      <div>
        <h2 class="section-title">
          Nutrición y Cuidados
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </h2>
        <p class="section-subtitle">Marcas líderes seleccionadas por nuestros especialistas</p>
      </div>
      ${isInternal ? `<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="navigate('productos')">Gestionar Stock</button>` : ''}
    </div>

    <div class="cards-grid-4">
      ${dispProds.map(prod => `
        <div class="product-card">
          <div class="card-image-wrap">
            <img src="${prod.imagen}" alt="${prod.nombre}">
            ${prod.stock <= 5 ? `<span class="card-badge badge-warning">Últimas ${prod.stock} pzas</span>` : `<span class="card-badge badge-success">${prod.stock} en stock</span>`}
          </div>
          <div class="card-content">
            <div>
              <div class="card-title">${prod.nombre}</div>
              <div class="card-meta">${prod.categoria_nombre}</div>
            </div>
            <div class="card-footer-row">
              <span class="card-price">$${prod.precio.toLocaleString()}</span>
              ${isInternal 
                ? `<button class="btn-pill btn-pill-primary btn-pill-sm" onclick="addProdToPOS(${prod.id})">+ POS</button>`
                : `<button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="showToast('Disponible en tienda física')">Ver Tienda</button>`
              }
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function triggerSearch() {
  const input = document.getElementById('escaparate-search');
  if (input) {
    showToast(`Buscando: "${input.value}"`);
  }
}

function filterEscaparate(category) {
  showToast(`Filtrado por: ${category}`);
}

/* ==========================================
   MÓDULO 1: DASHBOARD PRINCIPAL (/dashboard)
   Tarjetas KPI: Ventas del día, Mascotas disponibles vs cuarentena,
   alertas stock <= 5, accesos rápidos y últimas transacciones.
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

    <!-- Alert Box for Low Stock Items -->
    ${lowStockProds.length > 0 ? `
      <div class="data-card" style="margin-bottom: 32px; border-left: 4px solid #ef4444;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 16px; font-weight: 600;">⚠️ Alerta de Inventario Crítico</h3>
          <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="navigate('productos')">Reabastecer</button>
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

    <!-- Últimas Transacciones -->
    <div class="data-card">
      <div class="section-header" style="margin-bottom: 16px;">
        <h3 style="font-size: 18px; font-weight: 600;">Últimas Transacciones (POS)</h3>
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
            ${Store.ventas.map(v => `
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
   Split-Screen:
   - Panel Izquierdo: Pestañas Productos y Mascotas
   - Panel Derecho: Ticket Activo, Selector de Cliente y Cierre
========================================== */
function renderPOS(container) {
  const dispPets = Store.mascotas.filter(m => m.estado === 'Disponible');
  const dispProds = Store.productos.filter(p => p.stock > 0);

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
            <span style="font-size: 12px; color: var(--color-muted-gray);">Atiende: ${Store.currentUser ? Store.currentUser.nombre : 'Cajero'}</span>
          </div>

          <!-- Selector de Cliente -->
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
            Cobrar y Cerrar Venta
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

function finalizeSale() {
  if (Store.cart.items.length === 0) return;

  const client = Store.clientes.find(c => c.id === Store.cart.clienteId) || Store.clientes[0];
  const total = Store.cart.items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  // 1. Descontar stock de productos
  // 2. Cambiar estado de mascota a 'Vendido'
  Store.cart.items.forEach(item => {
    if (item.tipo === 'producto') {
      const p = Store.productos.find(x => x.id === item.id);
      if (p) p.stock = Math.max(0, p.stock - item.cantidad);
    } else if (item.tipo === 'mascota') {
      const m = Store.mascotas.find(x => x.id === item.id);
      if (m) m.estado = 'Vendido';
    }
  });

  // 3. Crear registro en ventas
  const newVenta = {
    id: 100 + Store.ventas.length + 1,
    folio: `V-2026-00${Store.ventas.length + 1}`,
    id_cliente: client.id,
    cliente_nombre: client.nombre,
    id_empleado: Store.currentUser ? Store.currentUser.id : 2,
    empleado_nombre: Store.currentUser ? Store.currentUser.nombre : 'Cajero',
    fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
    total: total,
    items: [...Store.cart.items]
  };

  Store.ventas.unshift(newVenta);
  Store.cart.items = [];

  showToast(`¡Venta cerrada con éxito! Folio: ${newVenta.folio}`);
  renderPOS(document.getElementById('main-content'));
}

/* ==========================================
   MÓDULO 3: GESTIÓN DE MASCOTAS (/mascotas)
   Inventario vivo con filtros por Especie, Raza, Estado y Modal de Alta
========================================== */
function renderMascotas(container) {
  const isGerente = Store.currentUser && Store.currentUser.puesto === 'Gerente';

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Inventario de Mascotas</h1>
        <p class="section-subtitle">Gestión clínica y comercial de ejemplares vivos</p>
      </div>
      <div>
        <button class="btn-pill btn-pill-primary" onclick="openNewPetModal()">
          + Dar de Alta Mascota
        </button>
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
                    ${pet.estado === 'Cuarentena' ? `
                      <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="changePetStatus(${pet.id}, 'Disponible')">Liberar a Venta</button>
                    ` : pet.estado === 'Disponible' ? `
                      <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="changePetStatus(${pet.id}, 'Cuarentena')">A Cuarentena</button>
                    ` : ''}
                    ${isGerente ? `
                      <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="deletePet(${pet.id})">Eliminar</button>
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
  const pet = Store.mascotas.find(m => m.id === id);
  if (pet) {
    pet.estado = newStatus;
    showToast(`Estado de mascota #${id} cambiado a: ${newStatus}`);
    renderMascotas(document.getElementById('main-content'));
  }
}

function deletePet(id) {
  Store.mascotas = Store.mascotas.filter(m => m.id !== id);
  showToast('Mascota eliminada del catálogo');
  renderMascotas(document.getElementById('main-content'));
}

/* ==========================================
   MÓDULO 4: INVENTARIO DE PRODUCTOS (/productos)
   Catálogo físico, filtros de categorías, badge stock y modal de stock
========================================== */
function renderProductos(container) {
  const isGerente = Store.currentUser && Store.currentUser.puesto === 'Gerente';

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Inventario de Productos</h1>
        <p class="section-subtitle">Control de existencias físicas y suministros</p>
      </div>
      <div>
        <button class="btn-pill btn-pill-primary" onclick="openNewProductModal()">
          + Nuevo Producto
        </button>
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
              <th>Proveedor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${Store.productos.map(p => {
              const prov = Store.proveedores.find(pr => pr.id === p.id_proveedor);
              return `
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
                  <td>${prov ? prov.nombre : 'General'}</td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="openStockModal(${p.id})">Entrada Stock</button>
                      ${isGerente ? `
                        <button class="btn-pill btn-pill-secondary btn-pill-sm" onclick="editProductPrice(${p.id})">Editar Precio</button>
                      ` : ''}
                    </div>
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

function openStockModal(productId) {
  const prod = Store.productos.find(p => p.id === productId);
  if (!prod) return;
  const cant = prompt(`Registrar entrada de mercancía para:\n"${prod.nombre}"\n\n¿Cuántas unidades ingresan al inventario?`, "5");
  if (cant && !isNaN(cant)) {
    prod.stock += parseInt(cant);
    showToast(`Stock actualizado. Total: ${prod.stock} unidades`);
    renderProductos(document.getElementById('main-content'));
  }
}

function editProductPrice(productId) {
  const prod = Store.productos.find(p => p.id === productId);
  if (!prod) return;
  const newPrice = prompt(`Modificar precio base de "${prod.nombre}":`, prod.precio);
  if (newPrice && !isNaN(newPrice)) {
    prod.precio = parseFloat(newPrice);
    showToast('Precio base actualizado con éxito');
    renderProductos(document.getElementById('main-content'));
  }
}

/* ==========================================
   MÓDULO 5: CATÁLOGOS MAESTROS (/catalogos)
   Solo Gerente: Pestañas Especies/Razas, Categorías y Proveedores
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
  const nombre = prompt("Nombre de la nueva especie (ej. Reptil, Roedor):");
  if (nombre) {
    Store.especies.push({ id: Store.especies.length + 1, nombre });
    showToast(`Especie "${nombre}" agregada.`);
    renderCatalogos(document.getElementById('main-content'));
  }
}

function addCategoriaPrompt() {
  const nombre = prompt("Nombre de la nueva categoría de producto:");
  if (nombre) {
    Store.categorias.push({ id: Store.categorias.length + 1, nombre });
    showToast(`Categoría "${nombre}" creada.`);
    renderCatalogos(document.getElementById('main-content'));
  }
}

function addProveedorPrompt() {
  const nombre = prompt("Nombre del proveedor / criadero:");
  if (nombre) {
    Store.proveedores.push({ id: Store.proveedores.length + 1, nombre, telefono: '555-0000', email: 'contacto@proveedor.com' });
    showToast(`Proveedor "${nombre}" registrado.`);
    renderCatalogos(document.getElementById('main-content'));
  }
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
  const nombre = prompt("Nombre completo del cliente:");
  if (!nombre) return;
  const telefono = prompt("Teléfono:", "555-000-0000") || "555-000-0000";
  const email = prompt("Email:", `${nombre.toLowerCase().replace(/\s+/g, '')}@ejemplo.com`) || "cliente@ejemplo.com";

  Store.clientes.push({
    id: Store.clientes.length + 1,
    nombre,
    telefono,
    email,
    password: '123'
  });

  showToast(`Cliente "${nombre}" registrado.`);
  renderClientes(document.getElementById('main-content'));
}

/* ==========================================
   MÓDULO 7: ADMINISTRACIÓN & AUDITORÍA (/admin)
   Solo Gerente: Personal y desglose completo de ventas históricas
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
  const nombre = prompt("Nombre completo del nuevo empleado:");
  if (!nombre) return;
  const puesto = prompt("Puesto ('Gerente', 'Cajero', 'Asesor'):", "Cajero") || "Cajero";
  const email = prompt("Correo del empleado:", `${nombre.toLowerCase().replace(/\s+/g, '')}@tienda.com`) || "emp@tienda.com";
  Store.empleados.push({
    id: Store.empleados.length + 1,
    nombre,
    puesto,
    email,
    password: '123',
    fecha_ingreso: new Date().toISOString().substring(0, 10)
  });
  showToast(`Empleado "${nombre}" dado de alta como ${puesto}`);
  renderAdmin(document.getElementById('main-content'));
}

function changeEmployeeRole(empId) {
  const emp = Store.empleados.find(e => e.id === empId);
  if (!emp) return;
  const nuevoPuesto = prompt(`Cambiar puesto de ${emp.nombre} ('Gerente', 'Cajero', 'Asesor'):`, emp.puesto);
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
      <p style="font-size: 14px;"><strong>Atendió:</strong> ${venta.empleado_nombre}</p>
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
   MODALES DE ALTA
========================================== */
function openNewPetModal() {
  const raza = prompt("Nombre de la Raza:", "Labrador Retriever");
  if (!raza) return;
  const especie = prompt("Especie ('Canino', 'Felino', 'Ave'):", "Canino") || "Canino";
  const precio = parseFloat(prompt("Precio de Venta ($):", "6500") || "6500");

  Store.mascotas.push({
    id: Store.mascotas.length + 1,
    id_raza: 1,
    raza_nombre: raza,
    especie: especie,
    id_proveedor: 1,
    fecha_nacimiento: new Date().toISOString().substring(0, 10),
    precio: precio,
    estado: 'Disponible',
    imagen: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'
  });

  showToast(`Mascota "${raza}" registrada en catálogo.`);
  renderMascotas(document.getElementById('main-content'));
}

function openNewProductModal() {
  const nombre = prompt("Nombre del producto:", "Snacks Naturales de Pollo");
  if (!nombre) return;
  const precio = parseFloat(prompt("Precio de venta ($):", "150") || "150");
  const stock = parseInt(prompt("Stock inicial:", "20") || "20");

  Store.productos.push({
    id: Store.productos.length + 1,
    nombre: nombre,
    id_categoria: 1,
    categoria_nombre: 'Alimentos y Nutrición',
    id_proveedor: 2,
    precio: precio,
    stock: stock,
    imagen: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=600&q=80'
  });

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

// Exportación al objeto window para llamadas inline en HTML
window.navigate = navigate;
window.loginUser = loginUser;
window.logout = logout;
window.switchLoginTab = switchLoginTab;
window.handleLoginSubmit = handleLoginSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.quickLoginRole = quickLoginRole;
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
window.addProdToPOS = addProdToPOS;
window.addPetToPOS = addPetToPOS;
window.updateQty = updateQty;
window.removeCartItem = removeCartItem;
window.finalizeSale = finalizeSale;
window.switchPOSTab = switchPOSTab;
window.changePOSClient = changePOSClient;
window.changePetStatus = changePetStatus;
window.deletePet = deletePet;
window.openStockModal = openStockModal;
window.editProductPrice = editProductPrice;
window.addEspeciePrompt = addEspeciePrompt;
window.addCategoriaPrompt = addCategoriaPrompt;
window.addProveedorPrompt = addProveedorPrompt;
window.openNewClientModal = openNewClientModal;
window.addNewEmployeePrompt = addNewEmployeePrompt;
window.changeEmployeeRole = changeEmployeeRole;
window.showTicketModal = showTicketModal;
window.closeTicketModal = closeTicketModal;
window.openNewPetModal = openNewPetModal;
window.openNewProductModal = openNewProductModal;
window.triggerSearch = triggerSearch;
window.filterEscaparate = filterEscaparate;
