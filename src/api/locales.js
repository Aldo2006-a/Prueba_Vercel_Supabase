// src/api/locales.js
// Llamadas a la API pública de locales y cartas (la usa el comensal)
// y conversión al formato que esperan las pantallas.
import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1', withCredentials: true });

const datos = (respuesta) => respuesta.data.data;

/* ---------- Llamadas ---------- */
export const obtenerLocales = async () => datos(await api.get('/stores'));

export const obtenerCartaLocal = async (idLocal) =>
  datos(await api.get(`/stores/${idLocal}/products`));

/* ---------- Conversiones ---------- */

// Local de la base de datos -> tarjeta de "Locales del campus".
// Aún no hay horarios ni reseñas en la base, por eso estado = Abierto y sin tiempo/calificación.
export const localALista = (local) => ({
  id: local.id,
  nombre: local.commercial_name,
  estado: 'Abierto',
  ubicacion: local.campus_location || '',
  tiempoPrep: '',
  calificacion: null,
  aperturaProx: '',
});

// Producto de la base de datos -> producto de la carta del comensal
export const productoAComensal = (producto) => ({
  id: producto.id,
  nombre: producto.name,
  descripcion: producto.description || '',
  precio: Number(producto.price),
  categoria: producto.category ? producto.category.name : 'Otros',
  categoriaOrden: producto.category ? producto.category.display_order : 0,
  categoriaId: producto.category_id,
  agotado: !producto.available,
  tiempoPrep: producto.preparation_time,
});

// Nombres de categoría sin repetir, en el orden definido por el local
export const categoriasDeCarta = (productos) => {
  const vistas = new Map();
  productos.forEach((p) => {
    if (!vistas.has(p.categoria)) {
      vistas.set(p.categoria, { orden: p.categoriaOrden, id: p.categoriaId });
    }
  });

  return [...vistas.entries()]
    .sort((a, b) => a[1].orden - b[1].orden || a[1].id - b[1].id)
    .map(([nombre]) => nombre);
};
