export type MenuOpcion = {
  id: string;
  nombre: string;
  deltaPrecio: string;
  disponible: boolean;
};

export type MenuGrupo = {
  id: string;
  nombre: string;
  obligatorio: boolean;
  minSeleccion: number;
  maxSeleccion: number;
  opciones: MenuOpcion[];
};

export type MenuProducto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  precioBase: string;
  prepTimeMinutes: number;
  disponible: boolean;
  orden: number;
  grupos: MenuGrupo[];
};

export type MenuCategoria = {
  id: string;
  nombre: string;
  orden: number;
  productos: MenuProducto[];
};

export type Menu = { categorias: MenuCategoria[] };

export type CartItem = {
  uid: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  opcionesIds: string[];
  opcionesLabel: string;
  notaLibre: string | null;
  precioUnitarioCents: number;
};
