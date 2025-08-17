import raw from '@/data/brands_models.json';

export type BrandToModels = Record<string, string[]>;

export function loadBrandCatalogSync(): BrandToModels {
  const src = raw as any;
  const arr = (src['Station cars'] || []) as Array<{ Brand: string; Models: string }>;
  const map: BrandToModels = {};
  for (const item of arr) {
    const brand = item.Brand?.trim();
    if (!brand) continue;
    const models = (item.Models || '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    map[brand] = models;
  }
  return map;
}

export async function loadBrandCatalog(): Promise<BrandToModels> {
  return loadBrandCatalogSync();
}

export function getSortedBrands(map: BrandToModels): string[] {
  return Object.keys(map).sort((a, b) => a.localeCompare(b));
}


