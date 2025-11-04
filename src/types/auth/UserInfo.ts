import type { Rol } from "../common/Rol";

export interface UserInfo {
  email: string;
  rol: Rol;
  id: number;
  isExpired: boolean;
}
