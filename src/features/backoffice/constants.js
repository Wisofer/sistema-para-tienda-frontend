import {
  BarChart3,
  Home,
  Package,
  Settings,
  ShieldUser,
  SquareTerminal,
  ShoppingCart,
  Tag,
  Truck,
  Users,
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "products", label: "Productos", icon: Package },
  { id: "categories", label: "Categorías", icon: Tag },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "pos", label: "Ventas", icon: ShoppingCart },
  { id: "cashier", label: "Caja", icon: SquareTerminal },
  { id: "users", label: "Usuarios", icon: ShieldUser },
  { id: "settings", label: "Configuraciones", icon: Settings },
  { id: "reports", label: "Reportes", icon: BarChart3 },
];

