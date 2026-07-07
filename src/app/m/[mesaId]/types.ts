export type {
  MenuOpcion,
  MenuGrupo,
  MenuProducto,
  MenuCategoria,
  MenuCombo,
  Menu,
  CartItem,
} from "@/components/menu/types";

export type PedidoEstado =
  | "CONFIRMADO"
  | "EN_PREPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

export type GrupoParticipante = {
  id: string;
  nombre: string;
  esAnfitrion: boolean;
  activo: boolean;
  acepto: boolean;
  soyYo: boolean;
};

export type GrupoCarritoItem = {
  id: string;
  participanteId: string;
  participanteNombre: string;
  esMio: boolean;
  nombre: string;
  esCombo: boolean;
  cantidad: number;
  precioUnitario: string;
  subtotal: string;
  opcionesLabel: string;
  notaLibre: string | null;
};

export type GrupoEstado = {
  sesionId: string;
  miId: string;
  soyAnfitrion: boolean;
  holdExpiraEn: string | null;
  tienePedidos: boolean;
  participantes: GrupoParticipante[];
  carrito: GrupoCarritoItem[];
  total: string;
  pendientes: string[];
  todosAceptaron: boolean;
};

export type SesionActual = {
  sesion: {
    id: string;
    estado: "ABIERTA" | "CERRADA" | "FUGADA" | "EXPIRADA";
    pedidos: Array<{
      id: string;
      numeroSesion: number;
      estado: PedidoEstado;
      confirmadoEn: string;
      canceladoMotivo: string | null;
      items: Array<{
        id: string;
        productoId: string | null;
        nombreCongelado: string | null;
        cantidad: number;
        precioUnitarioCongelado: string;
        notaLibre: string | null;
        modificadores: Array<{ nombreCongelado: string }>;
      }>;
    }>;
    encuesta: { id: string } | null;
  };
  total: string;
};
