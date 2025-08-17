import { Product, User } from '@/types/product';

export const mockUser: User = {
  _id: '1',
  fullName: 'Ahmed Hassan',
  email: 'ahmed.hassan@email.com',
  phone: '+964 770 123 4567',
  governorate: 'Baghdad',
  district: 'Al-Karkh',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
  isVerified: true,
  rating: 4.8,
  totalSales: 125,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-12-01T00:00:00Z'
};

export const mockProducts: Product[] = [
  {
    _id: '1',
    partName: 'Toyota Camry Front Brake Pads',
    partNumber: '04465-33470',
    brand: 'Toyota',
    category: 'brakes',
    compatibleModels: ['Camry'],
    yearRange: { from: 2012, to: 2018 },
    price: 45000,
    condition: 'New',
    stockCount: 5,
    description: 'Genuine Toyota brake pads for Camry. High quality OEM replacement parts with excellent stopping power.',
    images: [
      'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    specifications: {
      'Material': 'Ceramic',
      'Warranty': '12 months',
      'Weight': '2.5 kg'
    },
    features: ['OEM Quality', 'Low Noise', 'Long Lasting'],
    sellerId: '1',
    sellerName: 'Ahmed Hassan',
    sellerPhone: '+964 770 123 4567',
    sellerCity: 'Baghdad',
    sellerDistrict: 'Al-Karkh',
    status: 'active',
    views: 245,
    rating: 4.8,
    reviewCount: 15,
    isOEM: true,
    shippingOptions: ['Pickup', 'Delivery'],
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z'
  },
  {
    _id: '2',
    partName: 'Nissan Altima Headlight Assembly',
    partNumber: '26010-3TA0A',
    brand: 'Nissan',
    category: 'electrical',
    compatibleModels: ['Altima'],
    yearRange: { from: 2013, to: 2018 },
    price: 125000,
    condition: 'Used - Excellent',
    stockCount: 2,
    description: 'Left side headlight assembly for Nissan Altima. Perfect working condition with clear lens.',
    images: [
      'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    specifications: {
      'Side': 'Left',
      'Bulb Type': 'Halogen',
      'Warranty': '6 months'
    },
    features: ['Clear Lens', 'Perfect Fit', 'Tested Working'],
    sellerId: '2',
    sellerName: 'Sara Mohammed',
    sellerPhone: '+964 750 987 6543',
    sellerCity: 'Erbil',
    sellerDistrict: 'Erbil Center',
    status: 'active',
    views: 189,
    rating: 4.5,
    reviewCount: 8,
    isOEM: false,
    shippingOptions: ['Pickup'],
    createdAt: '2024-11-15T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z'
  },
  {
    _id: '3',
    partName: 'Honda Civic Engine Oil Filter',
    partNumber: '15400-PLM-A02',
    brand: 'Honda',
    category: 'engine',
    compatibleModels: ['Civic'],
    yearRange: { from: 2012, to: 2020 },
    price: 12000,
    condition: 'New',
    stockCount: 20,
    description: 'Genuine Honda oil filter for Civic models. Essential for engine maintenance.',
    images: [
      'https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=400'
    ],
    specifications: {
      'Type': 'Spin-on',
      'Thread': 'M20 x 1.5',
      'Height': '65mm'
    },
    features: ['OEM Part', 'High Filtration', 'Easy Install'],
    sellerId: '1',
    sellerName: 'Ahmed Hassan',
    sellerPhone: '+964 770 123 4567',
    sellerCity: 'Baghdad',
    sellerDistrict: 'Al-Rusafa',
    status: 'active',
    views: 321,
    rating: 4.9,
    reviewCount: 25,
    isOEM: true,
    shippingOptions: ['Pickup', 'Delivery'],
    createdAt: '2024-10-20T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z'
  }
];

export const announcements = [
  {
    id: '1',
    type: 'text',
    content: 'Special discount on all Toyota parts this week!',
    contentKu: 'داشکاندنی تایبەت لەسەر هەموو پارچەکانی تۆیۆتا ئەم هەفتەیە!'
  },
  {
    id: '2',
    type: 'image',
    content: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400',
    contentKu: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '3',
    type: 'text',
    content: 'New brake pads collection now available',
    contentKu: 'کۆمەڵگەی نوێی پەدی بریک ئێستا بەردەستە'
  },
  {
    id: '4',
    type: 'image',
    content: 'https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=400',
    contentKu: 'https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '5',
    type: 'text',
    content: 'Free delivery for orders above 100,000 IQD',
    contentKu: 'گەیاندنی خۆڕایی بۆ داواکارییەکانی سەرووی ١٠٠،٠٠٠ دینار'
  }
];