export type PaymentMethod = 'Pix' | 'Dinheiro' | 'Cartão';
export type AppointmentStatus = 'Pendente' | 'Confirmado' | 'Cancelado' | 'Concluído';
export type SubscriptionPlan = 'Básico' | 'Pro' | 'Trial Básico' | 'Trial Pro';
export type SubscriptionStatus = 'active' | 'suspended' | 'trialing' | 'canceled' | 'pending';

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string; // ISO date
  maxProfessionals: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

export interface Appointment {
  id: string;
  clientName: string;
  phone?: string;
  cpf?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  services: Service[];
  status: AppointmentStatus;
  paymentMethod?: PaymentMethod;
  isBlocked?: boolean;
  notes?: string;
  createdAt?: string;
}

export interface Sale {
  id: string;
  amount: number;
  method: PaymentMethod;
  timestamp: string;
  appointmentId?: string;
}

export interface Settings {
  shopName: string;
  shopLogo?: string;
  slug?: string;
  theme: 'light' | 'dark';
  pixKey?: string;
  pixName?: string;
  shopPhone?: string;
  services: Service[];
  subscription?: Subscription;
}

export interface BusySlot {
  id: string;
  date: string;
  time: string;
  appointmentId: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  photo?: string;
  commissionRate?: number;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
}

export interface AppData {
  appointments: Appointment[];
  sales: Sale[];
  settings: Settings;
  busySlots: BusySlot[];
  professionals: Professional[];
  inventory: Product[];
}
