export const carBrands = [
  {
    name: 'Toyota',
    models: ['Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander', 'Sienna', 'Tacoma', 'Tundra']
  },
  {
    name: 'Nissan', 
    models: ['Altima', 'Sentra', 'Maxima', 'Rogue', 'Murano', 'Pathfinder', 'Frontier', 'Titan']
  },
  {
    name: 'Hyundai',
    models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Genesis', 'Veloster', 'Ioniq']
  },
  {
    name: 'Kia',
    models: ['Forte', 'Optima', 'Sportage', 'Sorento', 'Soul', 'Rio', 'Stinger', 'Telluride']
  },
  {
    name: 'Honda',
    models: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit', 'HR-V', 'Ridgeline']
  }
];

export const iraqiGovernorates = [
  {
    name: 'Baghdad',
    nameKu: 'بەغداد',
    districts: [
      { name: 'Al-Karkh', nameKu: 'کەرخ' },
      { name: 'Al-Rusafa', nameKu: 'ڕەسافە' },
      { name: 'Al-Kadhimiya', nameKu: 'کاظمیە' },
      { name: 'Sadr City', nameKu: 'شاری سەدر' }
    ]
  },
  {
    name: 'Erbil',
    nameKu: 'هەولێر',
    districts: [
      { name: 'Erbil Center', nameKu: 'ناوەندی هەولێر' },
      { name: 'Soran', nameKu: 'سۆران' },
      { name: 'Shaqlawa', nameKu: 'شەقڵاوە' },
      { name: 'Koya', nameKu: 'کۆیە' }
    ]
  },
  {
    name: 'Sulaymaniyah',
    nameKu: 'سلێمانی',
    districts: [
      { name: 'Sulaymaniyah Center', nameKu: 'ناوەندی سلێمانی' },
      { name: 'Halabja', nameKu: 'هەڵەبجە' },
      { name: 'Ranya', nameKu: 'ڕانیە' },
      { name: 'Qaladze', nameKu: 'قەڵادزێ' }
    ]
  },
  {
    name: 'Dohuk',
    nameKu: 'دهۆک',
    districts: [
      { name: 'Dohuk Center', nameKu: 'ناوەندی دهۆک' },
      { name: 'Zakho', nameKu: 'زاخۆ' },
      { name: 'Amadiya', nameKu: 'ئامێدی' },
      { name: 'Semel', nameKu: 'سێمێل' }
    ]
  },
  {
    name: 'Basrah',
    nameKu: 'بەسرە',
    districts: [
      { name: 'Basrah Center', nameKu: 'ناوەندی بەسرە' },
      { name: 'Al-Qurna', nameKu: 'قورنە' },
      { name: 'Al-Zubair', nameKu: 'زوبەیر' },
      { name: 'Abu Al-Khaseeb', nameKu: 'ئەبوولخەسیب' }
    ]
  }
];

export const categories = [
  { id: 'engine', name: 'Engine & Drivetrain', nameKu: 'بزوێنەر و سیستەمی هێز', icon: '🔧', color: '#007bff' },
  { id: 'suspension', name: 'Suspension & Steering', nameKu: 'هەڵواسین و ئاراستەکردن', icon: '⚙️', color: '#6f42c1' },
  { id: 'brakes', name: 'Brakes', nameKu: 'بریک', icon: '🛑', color: '#dc3545' },
  { id: 'body', name: 'Body Parts', nameKu: 'پارچەکانی بۆدی', icon: '🚗', color: '#28a745' },
  { id: 'electrical', name: 'Lights & Electrical', nameKu: 'ڕووناکی و کارەبا', icon: '💡', color: '#ffc107' },
  { id: 'tyres', name: 'Tyres & Wheels', nameKu: 'تایەر و چەرخ', icon: '⚪', color: '#6c757d' },
  { id: 'interior', name: 'Interior Parts', nameKu: 'پارچەکانی ناوەوە', icon: '🪑', color: '#e83e8c' },
  { id: 'exterior', name: 'Exterior Accessories', nameKu: 'ئەکسێسوارەکانی دەرەوە', icon: '✨', color: '#20c997' },
  { id: 'fluids', name: 'Fluids & Lubricants', nameKu: 'شل و چەورەکان', icon: '🛢️', color: '#fd7e14' },
  { id: 'tools', name: 'Tools & Equipment', nameKu: 'ئامێر و پێداویستی', icon: '🔨', color: '#795548' },
  { id: 'performance', name: 'Performance Mods', nameKu: 'گۆڕانکاری پەرفۆرمانس', icon: '⚡', color: '#ff5722' },
  { id: 'brand', name: 'By Vehicle Brand', nameKu: 'بەپێی برانەی ئۆتۆمبێل', icon: '🏷️', color: '#9c27b0' }
];

export const conditions = [
  { value: 'New', label: 'New', labelKu: 'نوێ' },
  { value: 'Used - Excellent', label: 'Used - Excellent', labelKu: 'بەکارهاتوو - زۆر باش' },
  { value: 'Used - Good', label: 'Used - Good', labelKu: 'بەکارهاتوو - باش' },
  { value: 'Used - Fair', label: 'Used - Fair', labelKu: 'بەکارهاتوو - ناوەند' },
  { value: 'Damaged', label: 'Damaged', labelKu: 'زیانلێکەوتوو' }
];