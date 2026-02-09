export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  whatsappNumber?: string;
  role?: string;
  isActive?: boolean;
  canAddUsers?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
