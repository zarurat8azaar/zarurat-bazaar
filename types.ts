export type Category = 'All' | 'Groceries' | 'Clothing' | 'Electronics' | 'Furniture' | 'Automobiles' | 'Hardware' | 'Services' | 'Digital Services' | 'Digital Products';

export type Condition = 'New' | 'Used' | 'Service';

export type Role = 'Admin' | 'Director' | 'Shareholder' | 'Employee' | 'Distributor' | 'Shop' | 'Customer';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  condition: Condition;
  image: string;
  video?: string;
  description: string;
  rating: number;
  inStock: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: 'Services' | 'Digital Services';
  priceRange: string;
  description: string;
  image: string;
  video?: string;
  rating: number;
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  coordinates: { lat: number; lng: number };
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Address {
  id: string;
  label: string; // e.g., 'Home', 'Office'
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: Address;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  addresses: Address[];
  orders: Order[];
}

export interface CompanyInfo {
  name: string;
  parentCompany: string;
  headOffice: string;
  tagline: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'text' | 'file' | 'meeting' | 'call';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  allowedRoles: Role[];
  messages: Message[];
  icon: string;
  description: string;
}