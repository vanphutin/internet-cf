// src/types/index.ts

// ===================== ROLE =====================
export type UserRoleName = 'Admin' | 'Employee' | 'Customer'

export interface UserRole {
  role_id: number
  role_name: UserRoleName
}

// ===================== COMPUTER =====================
export type ComputerStatus = 'available' | 'in-use' | 'maintenance'

export interface Computer {
  computer_id: number
  name: string
  status: ComputerStatus
  ip_address: string
  location: string | null
  created_at: string
}

// ===================== CUSTOMER =====================
export interface Customer {
  customer_id: number
  name: string
  username: string
  password: string
  balance: number
  phone: string | null
  email: string | null
  role_id: number // 3
  current_computer_id: number | null
}

// ===================== EMPLOYEE =====================
export interface Employee {
  employee_id: number
  name: string
  username: string
  password: string
  phone: string | null
  email: string | null
  role_id: number // 1 | 2
}

// ===================== MENU =====================
export interface Menu {
  menu_id: number
  name: string
  description: string | null
  price: number
  stock: number
  created_at: string
}

// ===================== INVENTORY =====================
export interface Inventory {
  inventory_id: number
  name: string
  quantity: number
  last_updated: string
  menu_id: number | null
}

// ===================== ORDER =====================
export type OrderStatus = 'pending' | 'completed' | 'cancelled'

export interface Order {
  order_id: number
  customer_id: number | null
  employee_id: number | null
  total_price: number
  status: OrderStatus
  created_at: string
  computer_id: number | null
}

// ===================== ORDER DETAIL =====================
export interface OrderDetail {
  order_detail_id: number
  order_id: number | null
  menu_id: number | null
  quantity: number
  price: number
}

// ===================== MESSAGE =====================
export type SenderRole = 'customer' | 'employee'
export type ReceiverRole = SenderRole

export interface Message {
  message_id: number
  sender_id: number
  sender_role: SenderRole
  receiver_id: number
  receiver_role: ReceiverRole
  content: string
  sent_at: string
}

// ===================== DTOs =====================
export interface LoginDTO {
  username: string
  password: string
}

export interface CreateCustomerDTO {
  name: string
  username: string
  password: string
  phone?: string
  email?: string
}

export interface CreateOrderDTO {
  customer_id: number
  computer_id?: number
  items: { menu_id: number; quantity: number }[]
}

export interface UpdateComputerStatusDTO {
  status: ComputerStatus
}
