/**
 * Tienda de Mascotas - Mock Store & Reactive State
 * Prototipo según AGENTS.md (con funciones simuladas de API)
 */

// Bandera de desarrollo para simulación rápida de roles en /login (AGENTS.md sección 4.C)
const ENABLE_ROLE_SIMULATOR = true;

const Store = {
  // Configuración
  ENABLE_ROLE_SIMULATOR,

  // Estado de la sesión actual: null si no hay sesión iniciada
  // Cuando hay sesión: { id, nombre, email, puesto: 'Gerente' | 'Cajero' | 'Asesor' | 'Cliente', tipo: 'empleado' | 'cliente' }
  currentUser: null,
  
  // Categorías
  categorias: [
    { id: 1, nombre: 'Alimentos y Nutrición' },
    { id: 2, nombre: 'Accesorios y Paseo' },
    { id: 3, nombre: 'Higiene y Salud' },
    { id: 4, nombre: 'Juguetes' }
  ],

  // Especies y Razas
  especies: [
    { id: 1, nombre: 'Canino' },
    { id: 2, nombre: 'Felino' },
    { id: 3, nombre: 'Ave' }
  ],

  razas: [
    { id: 1, id_especie: 1, nombre: 'Golden Retriever' },
    { id: 2, id_especie: 1, nombre: 'Bulldog Francés' },
    { id: 3, id_especie: 2, nombre: 'Siamés' },
    { id: 4, id_especie: 2, nombre: 'Persa' },
    { id: 5, id_especie: 3, nombre: 'Canario Cantor' }
  ],

  proveedores: [
    { id: 1, nombre: 'Criadero San Bernardo', telefono: '555-1020', email: 'contacto@sanbernardo.com' },
    { id: 2, nombre: 'Distribuidora PetFood México', telefono: '555-3040', email: 'ventas@petfood.mx' },
    { id: 3, nombre: 'Criadero El Paraíso Felino', telefono: '555-7080', email: 'info@paraisofelino.com' }
  ],

  clientes: [
    { id: 1, nombre: 'Público General', telefono: 'N/A', email: 'general@tienda.com', password: '123' },
    { id: 2, nombre: 'Carlos Mendoza', telefono: '555-987-1234', email: 'carlos.m@gmail.com', password: '123' },
    { id: 3, nombre: 'Ana Sofía Garza', telefono: '555-432-8765', email: 'ana.garza@outlook.com', password: '123' }
  ],

  empleados: [
    { id: 1, nombre: 'Valeria Ramos', puesto: 'Gerente', email: 'valeria@tienda.com', password: '123', fecha_ingreso: '2024-01-15' },
    { id: 2, nombre: 'Eduardo Lozano', puesto: 'Cajero', email: 'eduardo@tienda.com', password: '123', fecha_ingreso: '2024-06-01' },
    { id: 3, nombre: 'Mariana Reyes', puesto: 'Asesor', email: 'mariana@tienda.com', password: '123', fecha_ingreso: '2024-08-20' }
  ],

  mascotas: [
    {
      id: 1,
      id_raza: 1,
      raza_nombre: 'Golden Retriever',
      especie: 'Canino',
      id_proveedor: 1,
      fecha_nacimiento: '2024-08-10',
      precio: 8500.00,
      estado: 'Disponible',
      imagen: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      id_raza: 2,
      raza_nombre: 'Bulldog Francés',
      especie: 'Canino',
      id_proveedor: 1,
      fecha_nacimiento: '2024-09-02',
      precio: 12000.00,
      estado: 'Disponible',
      imagen: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 3,
      id_raza: 3,
      raza_nombre: 'Siamés',
      especie: 'Felino',
      id_proveedor: 3,
      fecha_nacimiento: '2024-07-22',
      precio: 4500.00,
      estado: 'Disponible',
      imagen: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 4,
      id_raza: 4,
      raza_nombre: 'Persa',
      especie: 'Felino',
      id_proveedor: 3,
      fecha_nacimiento: '2024-09-14',
      precio: 6200.00,
      estado: 'Cuarentena',
      imagen: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 5,
      id_raza: 5,
      raza_nombre: 'Canario Cantor',
      especie: 'Ave',
      id_proveedor: 1,
      fecha_nacimiento: '2024-05-18',
      precio: 1100.00,
      estado: 'Disponible',
      imagen: 'https://images.unsplash.com/photo-1522858547550-3404744e3260?auto=format&fit=crop&w=600&q=80'
    }
  ],

  productos: [
    {
      id: 1,
      nombre: 'Alimento Premium Dog Adult 15kg',
      id_categoria: 1,
      categoria_nombre: 'Alimentos y Nutrición',
      id_proveedor: 2,
      precio: 1450.00,
      stock: 14,
      imagen: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      nombre: 'Correa Retráctil Ergonómica 5m',
      id_categoria: 2,
      categoria_nombre: 'Accesorios y Paseo',
      id_proveedor: 2,
      precio: 380.00,
      stock: 3, // alerta bajo stock <= 5
      imagen: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 3,
      nombre: 'Champú Hipoalergénico de Avena 500ml',
      id_categoria: 3,
      categoria_nombre: 'Higiene y Salud',
      id_proveedor: 2,
      precio: 220.00,
      stock: 8,
      imagen: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 4,
      nombre: 'Rascador Multinivel Torre Felina',
      id_categoria: 4,
      categoria_nombre: 'Juguetes',
      id_proveedor: 2,
      precio: 890.00,
      stock: 4, // alerta bajo stock <= 5
      imagen: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 5,
      nombre: 'Cama Ortopédica Memory Foam',
      id_categoria: 2,
      categoria_nombre: 'Accesorios y Paseo',
      id_proveedor: 2,
      precio: 750.00,
      stock: 9,
      imagen: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=600&q=80'
    }
  ],

  ventas: [
    {
      id: 101,
      folio: 'V-2026-001',
      id_cliente: 2,
      cliente_nombre: 'Carlos Mendoza',
      id_empleado: 2,
      empleado_nombre: 'Eduardo Lozano',
      fecha: '2026-11-18 14:30',
      total: 1830.00,
      items: [
        { tipo: 'producto', nombre: 'Alimento Premium Dog Adult 15kg', cantidad: 1, precio: 1450.00 },
        { tipo: 'producto', nombre: 'Correa Retráctil Ergonómica 5m', cantidad: 1, precio: 380.00 }
      ]
    },
    {
      id: 102,
      folio: 'V-2026-002',
      id_cliente: 3,
      cliente_nombre: 'Ana Sofía Garza',
      id_empleado: 2,
      empleado_nombre: 'Eduardo Lozano',
      fecha: '2026-11-19 11:15',
      total: 8500.00,
      items: [
        { tipo: 'mascota', nombre: 'Mascota: Golden Retriever', cantidad: 1, precio: 8500.00 }
      ]
    }
  ],

  // Carrito activo en POS
  cart: {
    clienteId: 1, // Por defecto público general
    items: []
  }
};

window.Store = Store;
