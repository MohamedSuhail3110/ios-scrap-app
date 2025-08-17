export interface Product {
  _id: string;
  partName: string;
  partNumber: string;
  brand: string;
  category: string;
  compatibleModels: string[];
  yearRange: {
    from: number;
    to: number;
  };
  price: number;
  condition: 'New' | 'Used - Excellent' | 'Used - Good' | 'Used - Fair' | 'Damaged';
  stockCount: number;
  description: string;
  images: string[];
  specifications: Record<string, string>;
  features: string[];
  // Basic seller information
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerCity: string;
  sellerDistrict: string;
  sellerEmail?: string;
  sellerAvatar?: string;
  sellerType?: 'individual' | 'business';
  
  // Verification and status
  sellerVerified?: boolean;
  sellerStatus?: string;
  
  // Ratings and metrics
  sellerRating?: number;
  totalReviews?: number;
  sellerReputation?: number;
  totalSales?: number;
  activeListings?: number;
  successRate?: number;
  responseRate?: number;
  avgResponseTime?: string;
  
  // Account information
  sellerJoinDate?: string | null;
  lastActive?: string;
  preferredLanguage?: string;
  
  // Business information
  businessName?: string;
  businessRegistration?: string;
  websiteUrl?: string;
  socialMedia?: { [key: string]: string };
  
  // Communication preferences
  preferredContactMethod?: string;
  availableHours?: string;
  status: 'active' | 'sold' | 'expired';
  views: number;
  rating: number;
  reviewCount: number;
  isOEM: boolean;
  shippingOptions: ('Pickup' | 'Delivery')[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  governorate: string;
  district: string;
  avatar?: string;
  isVerified: boolean;
  rating: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameKu: string;
  icon: string;
  color: string;
}