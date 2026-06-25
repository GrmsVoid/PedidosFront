export type {
  MenuOpcion,
  MenuGrupo,
  MenuProducto,
  MenuCategoria,
  Menu,
  CartItem,
} from "@/components/menu/types";

export type PedidoEstado =
  | "CONFIRMADO"
  | "EN_PREPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

export type SesionActual = {
  sesion: {
    id: string;
    estado: "ABIERTA" | "CERRADA" | "FUGADA";
    pedidos: Array<{
      id: string;
      numeroSesion: number;
      estado: PedidoEstado;
      confirmadoEn: string;
      canceladoMotivo: string | null;
      items: Array<{
        id: string;
        productoId: string;
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
