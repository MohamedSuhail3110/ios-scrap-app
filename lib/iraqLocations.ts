import rawData from '@/data/iraq_full_major_towns.json';

type IraqLocationEntry = {
  Governorate: string;
  District: string;
  'Capital City': string;
  'Other Major Towns'?: string;
};

const data = rawData as unknown as IraqLocationEntry[];

export const governorates: string[] = Array.from(
  new Set(data.map(d => d.Governorate.trim()))
).sort((a, b) => a.localeCompare(b));

export const districtsByGovernorate: Record<string, string[]> = governorates.reduce((acc, gov) => {
  const districts = Array.from(new Set(
    data.filter(d => d.Governorate.trim() === gov).map(d => d.District.trim())
  )).sort((a, b) => a.localeCompare(b));
  acc[gov] = districts;
  return acc;
}, {} as Record<string, string[]>);

export const citiesByDistrict: Record<string, string[]> = data.reduce((acc, entry) => {
  const district = entry.District.trim();
  const capitalCity = entry['Capital City'].trim();
  const otherTowns = entry['Other Major Towns']?.split(',').map(town => town.trim()).filter(Boolean) || [];
  
  if (!acc[district]) {
    acc[district] = [];
  }
  
  // Add capital city if not already present
  if (capitalCity && !acc[district].includes(capitalCity)) {
    acc[district].push(capitalCity);
  }
  
  // Add other major towns
  otherTowns.forEach(town => {
    if (town && !acc[district].includes(town)) {
      acc[district].push(town);
    }
  });
  
  return acc;
}, {} as Record<string, string[]>);


