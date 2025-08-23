import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { createSellItem, testBackendConnection } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/colors';
// Inline data: remove external dependencies for dropdowns
type BrandToModels = Record<string, string[]>;
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library'; // <-- Add this import for MediaLibrary

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DollarSign } from 'lucide-react-native';
import { usePathname } from 'expo-router';
import { addNotificationIfNotExists } from '@/store/notificationsSlice';

// Inline brands/models source (from data/brands_models.json)
const RAW_BRANDS_MODELS = {
  "Station cars": [
    {"Brand": "Toyota", "Models": "Corolla, Camry, RAV4, Land Cruiser, Hilux, Fortuner, Prado, Hiace, Prius, C-HR, Supra, bZ4X (EV), Tacoma, Yaris, Venza, GR86, Sienna, 4Runner, Sequoia, Tundra, Avalon, Belta, bZ3, Century, Allion, Levin GT, Crown, Corolla Cross, Frontlander, Crown Estate/Signia, Crown Sport, Grand Highlander, Harrier/Venza, Highlander/Kluger/Crown Kluger, Land Cruiser 70, Land Cruiser 300, Raize, Wildlander, Rush, Urban Cruiser (BEV), Urban Cruiser/Hyryder, Urban Cruiser Taisor, Yaris Cross, AC200, Agya/Wigo, Aqua, Corolla Hatchback, GR Corolla, Glanza/Starlet, Vitz, GR Yaris"},
    {"Brand": "Nissan", "Models": "Sunny, Altima, Patrol, X-Trail, Navara, Qashqai, Juke, Kicks, GT-R, Sentra, Maxima, Pathfinder, Armada, NV350 (Urvan), Tiida, Leaf (EV), Ariya (EV)"},
    {"Brand": "Hyundai", "Models": "Tucson, Santa Fe, Creta (ix25), Azera, Elantra, Accent, Grand Starex (H1), Kona, Palisade, Staria, Venue, i10, i20, i30, Ioniq 5 (EV), Ioniq 6 (EV), Genesis G70, G80, G90"},
    {"Brand": "Kia", "Models": "Sportage, Sorento, Picanto, Rio, Carnival, Telluride, EV6 (EV), Stinger, Soul, K5, K8, Cerato (Forte), Niro, Seltos, Bongo (truck)"},
    {"Brand": "Honda", "Models": "Civic, Accord, CR-V, HR-V, Pilot, City, Jazz (Fit), Odyssey, BR-V, e:NS1 (EV), Amaze, WR-V, ZR-V, Passport, Elevate, Civic Hatchback, Civic Type R, Integra, Ridgeline, Stepwgn, Freed, Mobilio, e:Ny1, Honda e, Prologue"},
    {"Brand": "Mitsubishi", "Models": "Pajero, L200/Triton, Outlander, ASX, Eclipse Cross, Attrage, Delica, Montero (discontinued)"},
    {"Brand": "Mazda", "Models": "Mazda3, Mazda6, CX-5, CX-9, CX-30, CX-50, MX-5 Miata, BT-50 (pickup)"},
    {"Brand": "Suzuki", "Models": "Swift, Vitara, Jimny, Ciaz, Baleno, Ertiga, Alto, Carry (pickup), Celerio, S-Presso"},
    {"Brand": "Lexus", "Models": "LX, GX, RX, NX, UX, ES, IS, LS, LC, RC"},
    {"Brand": "Chevrolet", "Models": "Cruze, Malibu, Tahoe, Suburban, Silverado, Camaro, Corvette, Trax, Trailblazer, Spark, Captiva, Equinox, Blazer, Bolt EV"},
    {"Brand": "Ford", "Models": "Mustang, Explorer, Edge, Escape, F-150, Ranger, Transit, Expedition, Bronco, Maverick, Territory, Taurus (discontinued)"},
    {"Brand": "Jeep", "Models": "Wrangler, Grand Cherokee, Cherokee, Compass, Renegade, Gladiator, Wagoneer, Grand Wagoneer"},
    {"Brand": "Dodge", "Models": "Charger, Challenger, Durango, Hornet, Grand Caravan (discontinued)"},
    {"Brand": "Ram", "Models": "1500, 2500, 3500, ProMaster, Dakota (discontinued)"},
    {"Brand": "Tesla", "Models": "Model S, Model 3, Model X, Model Y, Cybertruck, Roadster (upcoming), Semi"},
    {"Brand": "Volkswagen", "Models": "Tiguan, Touareg, Passat, Golf, Polo, Jetta, Amarok (pickup), ID.4 (EV), ID.6, Arteon, T-Roc"},
    {"Brand": "BMW", "Models": "3 Series, 5 Series, 7 Series, X1, X3, X5, X7, i4 (EV), i7 (EV), iX (EV), Z4, 2 Series, 4 Series, 8 Series"},
    {"Brand": "Mercedes-Benz", "Models": "C-Class, E-Class, S-Class, GLA, GLC, GLE, GLS, A-Class, CLA, GLB, EQS (EV), EQE (EV), G-Class, Maybach"},
    {"Brand": "Audi", "Models": "A3, A4, A6, A8, Q3, Q5, Q7, Q8, e-tron (EV), e-tron GT, TT, R8"},
    {"Brand": "Porsche", "Models": "911, Taycan (EV), Panamera, Macan, Cayenne, Cayman, Boxster"},
    {"Brand": "Volvo", "Models": "XC40, XC60, XC90, S60, S90, V60, V90, C40 (EV), EX90 (EV)"},
    {"Brand": "Land Rover", "Models": "Range Rover, Range Rover Sport, Range Rover Velar, Range Rover Evoque, Defender, Discovery"},
    {"Brand": "Jaguar", "Models": "XE, XF, F-Type, E-Pace, F-Pace, I-Pace (EV)"},
    {"Brand": "Opel", "Models": "Astra, Corsa, Insignia, Mokka, Crossland, Grandland, Combo (van)"},
    {"Brand": "Peugeot", "Models": "208, 301, 308, 3008, 5008, Partner (pickup), 2008, 408, 508"},
    {"Brand": "Renault", "Models": "Logan, Duster, Koleos, Megane, Captur, Talisman, Arkana, Kwid, Master (van)"},
    {"Brand": "Haval", "Models": "H6, H9, Jolion, F7, F7x, Dargo, H2"},
    {"Brand": "Changan", "Models": "CS35, CS55, CS75, CS95, Alsvin, Eado, UNI-T, UNI-K"},
    {"Brand": "Chery", "Models": "Tiggo 4, Tiggo 7, Tiggo 8, Arrizo 5, Arrizo 6, QQ, Fulwin"},
    {"Brand": "MG", "Models": "MG5, MG6, ZS, HS, RX5, RX8, Marvel R (EV)"},
    {"Brand": "Geely", "Models": "Coolray (Binyue), Tugella (Xingyue), Emgrand, Boyue, Geometry C"},
    {"Brand": "BYD", "Models": "Han, Tang, Song, Qin, Atto 3 (EV), Dolphin (EV), Seal (EV)"},
    {"Brand": "JAC", "Models": "S3, S5, S7, T6 (pickup), iEV7S (EV)"},
    {"Brand": "FAW", "Models": "Bestune T77, Bestune T99, X40, V2 (pickup)"},
    {"Brand": "Brilliance", "Models": "H530, V5, V7"},
    {"Brand": "Proton", "Models": "Saga, X50, X70, Persona, Exora"},
    {"Brand": "SsangYong", "Models": "Rexton, Tivoli, Korando, Musso (pickup)"},
    {"Brand": "Isuzu", "Models": "D-Max, MU-X, NPR (truck)"}
  ]
} as const;

const INLINE_BRAND_MAP: BrandToModels = (() => {
  const arr = (RAW_BRANDS_MODELS as any)['Station cars'] as Array<{ Brand: string; Models: string }>;
  const map: BrandToModels = {};
  for (const item of arr) {
    const brand = item.Brand?.trim();
    if (!brand) continue;
    const models = (item.Models || '').split(',').map(m => m.trim()).filter(Boolean);
    map[brand] = models;
  }
  return map;
})();

// Inline Iraq locations (from data/iraq_full_major_towns.json)
type IraqLocationEntry = {
  Governorate: string;
  District: string;
  'Capital City': string;
  'Other Major Towns'?: string;
};

const RAW_IRAQ_LOCATIONS: IraqLocationEntry[] = [
  {"Governorate":"Al Anbar","District":"Al-Qa'im","Capital City":"Al-Qa'im","Other Major Towns":"Kharab al-Jir, Qaim market"},
  {"Governorate":"Al Anbar","District":"Ar-Rutba","Capital City":"Ar-Rutba","Other Major Towns":"Nukhayb, Akashat"},
  {"Governorate":"Al Anbar","District":"Anah","Capital City":"Anah","Other Major Towns":"Rawa, Al-Qahtaniya"},
  {"Governorate":"Al Anbar","District":"Fallujah","Capital City":"Fallujah","Other Major Towns":"Saqlawiyah, Amiriyat al-Fallujah"},
  {"Governorate":"Al Anbar","District":"Haditha","Capital City":"Haditha","Other Major Towns":"Barwana, Haqlaniyah"},
  {"Governorate":"Al Anbar","District":"Heet","Capital City":"Heet","Other Major Towns":"Kubaisa, Al-Baghdadi"},
  {"Governorate":"Al Anbar","District":"Ramadi","Capital City":"Ramadi","Other Major Towns":"Khalidiya, Habbaniyah"},
  {"Governorate":"Al Anbar","District":"Rawah","Capital City":"Rawah","Other Major Towns":"Qasr al-Izza"},
  {"Governorate":"Babil","District":"Al-Mahawil","Capital City":"Al-Mahawil"},
  {"Governorate":"Babil","District":"Al-Musayab","Capital City":"Al-Musayab","Other Major Towns":"Jurf al-Sakhar"},
  {"Governorate":"Babil","District":"Hashimiya","Capital City":"Hashimiya"},
  {"Governorate":"Babil","District":"Hilla","Capital City":"Hilla","Other Major Towns":"Al-Qasim, Al-Iskandariya"},
  {"Governorate":"Baghdad","District":"Rusafa","Capital City":"Rusafa (Baghdad East)"},
  {"Governorate":"Baghdad","District":"Adhamiyah","Capital City":"Adhamiyah"},
  {"Governorate":"Baghdad","District":"Sadr City","Capital City":"Sadr City (Al-Sadr)"},
  {"Governorate":"Baghdad","District":"New Baghdad (9 Nissan)","Capital City":"New Baghdad"},
  {"Governorate":"Baghdad","District":"Karkh","Capital City":"Karkh (Baghdad West)"},
  {"Governorate":"Baghdad","District":"Kadhimyah","Capital City":"Kadhimyah"},
  {"Governorate":"Baghdad","District":"Mansour","Capital City":"Mansour"},
  {"Governorate":"Baghdad","District":"Al-Rashid","Capital City":"Al-Rashid"},
  {"Governorate":"Baghdad","District":"Abu Ghraib","Capital City":"Abu Ghraib"},
  {"Governorate":"Baghdad","District":"Mahmudiya","Capital City":"Mahmudiya"},
  {"Governorate":"Baghdad","District":"Taji","Capital City":"Taji"},
  {"Governorate":"Baghdad","District":"Tarmiya","Capital City":"Tarmiya"},
  {"Governorate":"Baghdad","District":"Al-Mada'in","Capital City":"Al-Mada'in","Other Major Towns":"Sadr Al-Yusufiya"},
  {"Governorate":"Basra","District":"Abu Al-Khaseeb","Capital City":"Abu Al-Khaseeb"},
  {"Governorate":"Basra","District":"Al-Midaina","Capital City":"Al-Midaina"},
  {"Governorate":"Basra","District":"Al-Qurna","Capital City":"Al-Qurna"},
  {"Governorate":"Basra","District":"Al-Zubair","Capital City":"Al-Zubair"},
  {"Governorate":"Basra","District":"Basrah","Capital City":"Basrah","Other Major Towns":"Umm Qasr"},
  {"Governorate":"Basra","District":"Al-Faw","Capital City":"Al-Faw"},
  {"Governorate":"Dhi Qar","District":"Al-Chibayish","Capital City":"Al-Chibayish"},
  {"Governorate":"Dhi Qar","District":"Al-Rifa'i","Capital City":"Al-Rifa'i"},
  {"Governorate":"Dhi Qar","District":"Al-Shatra","Capital City":"Al-Shatra"},
  {"Governorate":"Dhi Qar","District":"Nasiriyah","Capital City":"Nasiriyah","Other Major Towns":"Qalat Sukkar"},
  {"Governorate":"Dhi Qar","District":"Suq Al-Shoyukh","Capital City":"Suq Al-Shoyukh"},
  {"Governorate":"Diyala","District":"Al-Khalis","Capital City":"Al-Khalis"},
  {"Governorate":"Diyala","District":"Al-Muqdadiya","Capital City":"Al-Muqdadiya"},
  {"Governorate":"Diyala","District":"Ba'quba","Capital City":"Ba'quba","Other Major Towns":"Khanaqin"},
  {"Governorate":"Diyala","District":"Balad Ruz","Capital City":"Balad Ruz"},
  {"Governorate":"Diyala","District":"Kifri","Capital City":"Kifri"},
  {"Governorate":"Duhok","District":"Amadiya","Capital City":"Amadiya"},
  {"Governorate":"Duhok","District":"Duhok","Capital City":"Duhok"},
  {"Governorate":"Duhok","District":"Sumel","Capital City":"Sumel (Simele)"},
  {"Governorate":"Duhok","District":"Zakho","Capital City":"Zakho","Other Major Towns":"Semsur"},
  {"Governorate":"Erbil","District":"Erbil","Capital City":"Erbil (Hewlêr)","Other Major Towns":"Makhmur"},
  {"Governorate":"Erbil","District":"Soran","Capital City":"Soran","Other Major Towns":"Choman"},
  {"Governorate":"Erbil","District":"Shaqlawa","Capital City":"Shaqlawa"},
  {"Governorate":"Erbil","District":"Koya","Capital City":"Koya"},
  {"Governorate":"Erbil","District":"Mexmur","Capital City":"Mexmûr"},
  {"Governorate":"Erbil","District":"Rewandiz","Capital City":"Rewandiz"},
  {"Governorate":"Halabja","District":"Halabja","Capital City":"Halabja","Other Major Towns":"Sharbazher, Byara"},
  {"Governorate":"Karbala","District":"Ain al-Tamur","Capital City":"Ain al-Tamur"},
  {"Governorate":"Karbala","District":"Al-Hindiya","Capital City":"Al-Hindiya"},
  {"Governorate":"Karbala","District":"Karbala","Capital City":"Karbala","Other Major Towns":"Ain al-Tamur area"},
  {"Governorate":"Kirkuk","District":"Al-Hawiga","Capital City":"Al-Hawiga"},
  {"Governorate":"Kirkuk","District":"Daquq","Capital City":"Daquq"},
  {"Governorate":"Kirkuk","District":"Kirkuk","Capital City":"Kirkuk (Hawler)"},
  {"Governorate":"Kirkuk","District":"Al-Dibs","Capital City":"Al-Dibs"},
  {"Governorate":"Maysan","District":"Ali Al-Gharbi","Capital City":"Ali Al-Gharbi"},
  {"Governorate":"Maysan","District":"Al-Kahla","Capital City":"Al-Kahla"},
  {"Governorate":"Maysan","District":"Al-Maimouna","Capital City":"Al-Maimouna"},
  {"Governorate":"Maysan","District":"Al-Mejar Al-Kabi","Capital City":"Al-Mejar Al-Kabi"},
  {"Governorate":"Maysan","District":"Amarah","Capital City":"Amarah","Other Major Towns":"Qal'at Saleh"},
  {"Governorate":"Muthanna","District":"Al-Khidhir","Capital City":"Al-Khidhir"},
  {"Governorate":"Muthanna","District":"Al-Rumaitha","Capital City":"Al-Rumaitha"},
  {"Governorate":"Muthanna","District":"Al-Salman","Capital City":"Al-Salman"},
  {"Governorate":"Muthanna","District":"Al-Samawa","Capital City":"Al-Samawa"},
  {"Governorate":"Najaf","District":"Al-Manathera","Capital City":"Al-Manathera"},
  {"Governorate":"Najaf","District":"Kufa","Capital City":"Kufa"},
  {"Governorate":"Najaf","District":"Najaf","Capital City":"Najaf","Other Major Towns":"Samarra?"},
  {"Governorate":"Nineveh","District":"Akre","Capital City":"Akre"},
  {"Governorate":"Nineveh","District":"Al-Ba'aj","Capital City":"Al-Ba'aj"},
  {"Governorate":"Nineveh","District":"Al-Hamdaniya","Capital City":"Al-Hamdaniya","Other Major Towns":"Bakhdida (Qaraqosh)"},
  {"Governorate":"Nineveh","District":"Hatra","Capital City":"Hatra"},
  {"Governorate":"Nineveh","District":"Mosul","Capital City":"Mosul","Other Major Towns":"Hamam al-Alil"},
  {"Governorate":"Nineveh","District":"Shekhan","Capital City":"Shekhan"},
  {"Governorate":"Nineveh","District":"Sinjar","Capital City":"Sinjar","Other Major Towns":"Shingal"},
  {"Governorate":"Nineveh","District":"Tel Afar","Capital City":"Tel Afar","Other Major Towns":"Agileh"},
  {"Governorate":"Nineveh","District":"Tel Keppe","Capital City":"Tel Keppe","Other Major Towns":"Tel Kaif"},
  {"Governorate":"Qadisiyyah","District":"Afaq","Capital City":"Afaq"},
  {"Governorate":"Qadisiyyah","District":"Al-Shamiya","Capital City":"Al-Shamiya"},
  {"Governorate":"Qadisiyyah","District":"Diwaniya","Capital City":"Diwaniya"},
  {"Governorate":"Qadisiyyah","District":"Hamza","Capital City":"Hamza"},
  {"Governorate":"Saladin","District":"Al-Daur","Capital City":"Al-Daur"},
  {"Governorate":"Saladin","District":"Al-Shirqat","Capital City":"Al-Shirqat","Other Major Towns":"Sharqat area"},
  {"Governorate":"Saladin","District":"Baiji","Capital City":"Baiji"},
  {"Governorate":"Saladin","District":"Balad","Capital City":"Balad"},
  {"Governorate":"Saladin","District":"Samarra","Capital City":"Samarra"},
  {"Governorate":"Saladin","District":"Tikrit","Capital City":"Tikrit"},
  {"Governorate":"Saladin","District":"Tooz (Tuz Khurmatu)","Capital City":"Tuz Khurmatu"},
  {"Governorate":"Saladin","District":"Dujail","Capital City":"Dujail"},
  {"Governorate":"Sulaymaniyah","District":"Sulaymaniyah","Capital City":"Sulaymaniyah (Slemani)","Other Major Towns":"Kalar, Ranya"},
  {"Governorate":"Sulaymaniyah","District":"Chamchamal","Capital City":"Chamchamal"},
  {"Governorate":"Sulaymaniyah","District":"Penjwen","Capital City":"Penjwen"},
  {"Governorate":"Wasit","District":"Al-Azezia","Capital City":"Al-Azezia"},
  {"Governorate":"Wasit","District":"Al-Hai","Capital City":"Al-Hai"},
  {"Governorate":"Wasit","District":"Al-Na'maniya","Capital City":"Al-Na'maniya"},
  {"Governorate":"Wasit","District":"Al-Suwaira","Capital City":"Al-Suwaira"},
  {"Governorate":"Wasit","District":"Badra","Capital City":"Badra"},
  {"Governorate":"Wasit","District":"Kut","Capital City":"Kut"}
];

const governorates = Array.from(new Set(RAW_IRAQ_LOCATIONS.map(d => d.Governorate.trim()))).sort((a, b) => a.localeCompare(b));
const districtsByGovernorate: Record<string, string[]> = governorates.reduce((acc, gov) => {
  const districts = Array.from(new Set(
    RAW_IRAQ_LOCATIONS.filter(d => d.Governorate.trim() === gov).map(d => d.District.trim())
  )).sort((a, b) => a.localeCompare(b));
  acc[gov] = districts;
  return acc;
}, {} as Record<string, string[]>);

const citiesByDistrict: Record<string, string[]> = RAW_IRAQ_LOCATIONS.reduce((acc, entry) => {
  const district = entry.District.trim();
  const capitalCity = entry['Capital City'].trim();
  const otherTowns = entry['Other Major Towns']?.split(',').map(t => t.trim()).filter(Boolean) || [];
  if (!acc[district]) acc[district] = [];
  if (capitalCity && !acc[district].includes(capitalCity)) acc[district].push(capitalCity);
  otherTowns.forEach(town => { if (town && !acc[district].includes(town)) acc[district].push(town); });
  return acc;
}, {} as Record<string, string[]>);

// Custom Dropdown component with better iOS/iPhone support
const CustomDropdown = ({ 
  selectedValue, 
  onValueChange, 
  items, 
  placeholder,
  enabled = true,
  style,
  ...props 
}: { 
  selectedValue: any;
  onValueChange: (value: string) => void;
  items: Array<{ label: string; value: string; }>;
  placeholder: string;
  enabled?: boolean;
  style?: any;
  [key: string]: any;
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { t } = useTranslation();

  // Ensure we always have a valid string value
  const safeValue = useMemo(() => {
    if (selectedValue === null || selectedValue === undefined) {
      return '';
    }
    return String(selectedValue);
  }, [selectedValue]);

  // Ensure items is always an array with proper structure
  const safeItems = useMemo(() => {
    if (!Array.isArray(items)) {
      console.warn('CustomDropdown: items is not an array:', items);
      return [];
    }
    
    return items.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn('CustomDropdown: Invalid item:', item);
        return false;
      }
      if (!item.hasOwnProperty('label') || !item.hasOwnProperty('value')) {
        console.warn('CustomDropdown: Item missing label or value:', item);
        return false;
      }
      return true;
    }).map(item => ({
      label: String(item.label || item.value || ''),
      value: String(item.value || '')
    }));
  }, [items]);

  // Filter items based on search text
  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return safeItems;
    return safeItems.filter(item => 
      item.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [safeItems, searchText]);

  // Get selected item label
  const selectedLabel = useMemo(() => {
    if (!safeValue || safeValue === '') {
      return placeholder;
    }
    const selectedItem = safeItems.find(item => String(item.value) === String(safeValue));
    return selectedItem ? selectedItem.label : placeholder;
  }, [safeValue, safeItems, placeholder]);

  // Check if we have a selected value (not placeholder)
  const hasSelectedValue = useMemo(() => {
    return safeValue && safeValue !== '' && safeItems.some(item => String(item.value) === String(safeValue));
  }, [safeValue, safeItems]);

  const handleItemSelect = (value: string) => {
    onValueChange(value);
    setIsModalVisible(false);
    setSearchText('');
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSearchText('');
  };

  const renderItem = ({ item }: { item: { label: string; value: string } }) => {
    const isSelected = String(item.value) === String(safeValue);
    return (
      <TouchableOpacity
        style={[
          styles.dropdownItem,
          isSelected && styles.dropdownItemSelected
        ]}
        onPress={() => handleItemSelect(item.value)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dropdownItemText,
          isSelected && styles.dropdownItemTextSelected
        ]}>
          {item.label || item.value}
        </Text>
        {isSelected && (
          <Text style={styles.dropdownItemCheck}>{t('common.selectedCheck', '✓')}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.customDropdownButton,
          !enabled && styles.customDropdownDisabled,
          style
        ]}
        onPress={() => enabled && setIsModalVisible(true)}
        disabled={!enabled}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.customDropdownText,
          !hasSelectedValue && styles.customDropdownPlaceholder,
          !enabled && styles.customDropdownTextDisabled
        ]}>
          {selectedLabel}
        </Text>
        <Text style={[
          styles.customDropdownArrow,
          !enabled && styles.customDropdownArrowDisabled
        ]}>
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {placeholder} ({safeItems.length} {t('common.items', 'items')})
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleModalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {safeItems.length > 10 && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('common.search', 'Search...')}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            )}

            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item, index) => `dropdown-item-${item.value || index}-${index}`}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={true}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchText.trim() ? t('common.noItemsFound', 'No items found matching your search') : t('common.noItemsAvailable', 'No items available')}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

// 1. Add a type for the image object at the top:
type SellImage = {
  uri: string;
  mimeType: string;
  type: string;
  fileName: string;
  name: string;
};
type FormDataType = {
  partName: string;
  brand: string;
  category: string;
  model: string;
  year: string;
  price: string;
  state: string;
  district: string;
  city: string;
  image: SellImage | null;
  condition: string;
  description: string;
  stockCount: string;
  sellerName: string;
  sellerPhone: string;
  sellerCity: string;
  oem: boolean;
  specifications: { key: string; value: string }[];
  features: string[];
};

const SellPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t, ready } = useTranslation();
  const [backendReady, setBackendReady] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [brandMap, setBrandMap] = useState<BrandToModels>({});
  const [brandList, setBrandList] = useState<string[]>([]);
  const [modelList, setModelList] = useState<string[]>([]);

  // Fallback data in case imports fail
  const fallbackCarBrands = [
    'Toyota', 'Nissan', 'Hyundai', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Honda'
  ];

  const fallbackGovernorates = [
    'Baghdad', 'Basra', 'Mosul', 'Erbil', 'Sulaymaniyah', 'Duhok', 'Kirkuk', 'Najaf', 'Karbala', 'Wasit'
  ];

  const fallbackDistricts: Record<string, string[]> = {
    'Baghdad': ['Central', 'North', 'South', 'East', 'West'],
    'Basra': ['Central', 'North', 'South'],
    'Mosul': ['Central', 'North', 'South'],
    'Erbil': ['Central', 'North', 'South'],
    'Sulaymaniyah': ['Central', 'North', 'South'],
    'Duhok': ['Central', 'North', 'South'],
    'Kirkuk': ['Central', 'North', 'South'],
    'Najaf': ['Central', 'North', 'South'],
    'Karbala': ['Central', 'North', 'South'],
    'Wasit': ['Central', 'North', 'South']
  };

  const fallbackCities: Record<string, string[]> = {
    'Central': ['Central City', 'Main District'],
    'North': ['North City', 'Upper District'],
    'South': ['South City', 'Lower District'],
    'East': ['East City', 'Eastern District'],
    'West': ['West City', 'Western District']
  };

  const fallbackCategories = [
    { value: 'Engine & Drivetrain', label: 'Engine & Drivetrain (Includes engine, gearbox, clutch, turbo, etc.)' },
    { value: 'Suspension & Steering', label: 'Suspension & Steering (Shocks, control arms, steering racks)' },
    { value: 'Brakes', label: 'Brakes (Pads, discs, calipers, cylinders)' },
    { value: 'Body Parts', label: 'Body Parts (Doors, bumpers, fenders, bonnet, mirrors)' },
    { value: 'Lights & Electrical', label: 'Lights & Electrical (Headlights, tail lights, batteries, alternators)' },
    { value: 'Tyres & Wheels', label: 'Tyres & Wheels (Rims, tyres, alloys)' },
    { value: 'Interior Parts', label: 'Interior Parts (Seats, dashboards, steering wheels, infotainment)' },
    { value: 'Exterior Accessories', label: 'Exterior Accessories (Roof racks, spoilers, number plates, mud flaps)' },
    { value: 'Fluids & Lubricants', label: 'Fluids & Lubricants (Engine oil, coolant, brake fluid)' },
    { value: 'Tools & Equipment', label: 'Tools & Equipment (Jacks, diagnostic tools, wrenches)' },
    { value: 'Performance Mods', label: 'Performance Mods (Aftermarket filters, exhausts, tuning parts)' },
    { value: 'By Vehicle Brand', label: 'By Vehicle Brand' }
  ];

  // Initialize form data with proper defaults
    const getInitialFormData = useMemo(() => {
    return (): FormDataType => ({
      partName: '',
      brand: '',
      category: '',
      model: '',
      year: '',
      price: '',
      state: '',
      district: '',
      city: '',
      image: null,
      condition: '',
      description: '',
      stockCount: '1',
      sellerName: user?.fullName || '',
      sellerPhone: user?.phone || '',
      sellerCity: user?.governorate || '',
      oem: false,
      specifications: [{ key: '', value: '' }],
      features: ['']
    });
  }, [user]);

  const [formData, setFormData] = useState<FormDataType>(() => getInitialFormData());

  // Safely get location data with fallbacks
  const carBrands = useMemo(() => {
    try {
      const brands = brandList && brandList.length > 0 ? brandList : Object.keys(INLINE_BRAND_MAP);
      const sorted = [...brands].sort((a, b) => a.localeCompare(b));
      return sorted.map(brand => ({ label: brand, value: brand }));
    } catch (error) {
      console.warn('Error getting car brands, using fallback:', error);
      return Object.keys(INLINE_BRAND_MAP).map(brand => ({ label: brand, value: brand }));
    }
  }, [brandList]);

  const iraqStates = useMemo(() => {
    try {
      const states = governorates && governorates.length > 0 ? governorates : fallbackGovernorates;
      return states.map(state => ({ label: state, value: state }));
    } catch (error) {
      console.warn('Error getting governorates, using fallback:', error);
      return fallbackGovernorates.map(state => ({ label: state, value: state }));
    }
  }, []);

  const availableDistricts = useMemo(() => {
    if (!formData.state) return [];
    try {
      const districtMap = districtsByGovernorate && Object.keys(districtsByGovernorate).length > 0 
        ? districtsByGovernorate 
        : fallbackDistricts;
      const districts = districtMap[formData.state] || [];
      return districts.map(district => ({ label: district, value: district }));
    } catch (error) {
      console.warn('Error getting districts, using fallback:', error);
      const districts = fallbackDistricts[formData.state] || [];
      return districts.map(district => ({ label: district, value: district }));
    }
  }, [formData.state]);

  const availableCities = useMemo(() => {
    if (!formData.district) return [];
    try {
      const cityMap = citiesByDistrict && Object.keys(citiesByDistrict).length > 0 
        ? citiesByDistrict 
        : fallbackCities;
      const cities = cityMap[formData.district] || [];
      return cities.map(city => ({ label: city, value: city }));
    } catch (error) {
      console.warn('Error getting cities, using fallback:', error);
      const cities = fallbackCities[formData.district] || [];
      return cities.map(city => ({ label: city, value: city }));
    }
  }, [formData.district]);

  // Precompute union of all models for resilience
  const allModelsUnion = useMemo(() => {
    const set = new Set<string>();
    Object.values(brandMap || {}).forEach(list => (list || []).forEach(m => set.add(String(m))));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [brandMap]);

  const availableModels = useMemo(() => {
    const selected = (formData.brand || '').trim();
    if (!selected) return allModelsUnion.map(model => ({ label: model, value: model }));
    const direct = brandMap[selected];
    if (direct && direct.length) return direct.map(model => ({ label: model, value: model }));
    const fuzzyKey = Object.keys(brandMap || {}).find(k => k.toLowerCase() === selected.toLowerCase());
    const fallback = fuzzyKey ? brandMap[fuzzyKey] : [];
    const list = (fallback && fallback.length ? fallback : allModelsUnion);
    return list.map(model => ({ label: model, value: model }));
  }, [formData.brand, brandMap, allModelsUnion]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1990 + 1 }, (_, i) => {
      const year = currentYear - i;
      return { label: year.toString(), value: year.toString() };
    });
  }, []);

  const conditionOptions = useMemo(() => [
    { value: 'new', label: t('sell.conditionOptions.new') || 'New' },
    { value: 'used', label: t('sell.conditionOptions.usedVerified') || 'Used - Verified' },
    { value: 'refurbished', label: t('sell.conditionOptions.refurbishedLikeNew') || 'Refurbished - Like New' }
  ], [t]);

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      router.replace('/signin');
      return;
    }
    
    // Initialize form data with user information
    setFormData(prev => ({
      ...prev,
      sellerName: user?.fullName || '',
      sellerPhone: user?.phone || '',
      sellerCity: user?.governorate || '',
    }));
  }, [user, router]);

  // Initialize brands/models from inline data (no external fetch/deps)
  useEffect(() => {
      try {
      setBrandMap(INLINE_BRAND_MAP);
      setBrandList(Object.keys(INLINE_BRAND_MAP));
      } catch (e) {
      console.warn('Failed to initialize brand catalog, falling back to basic brands', e);
      setBrandMap({});
        setBrandList(fallbackCarBrands);
      }
  }, []);

  // Check backend connectivity
  useEffect(() => {
    (async () => {
      try {
        await testBackendConnection();
        setBackendReady(true);
      } catch (e) {
        setBackendReady(false);
      }
    })();
  }, []);

  // Update model list when brand changes
  useEffect(() => {
    if (!brandMap || !formData.brand) {
      setModelList([]);
      return;
    }
    const models = brandMap[formData.brand] || [];
    setModelList(models);
  }, [formData.brand, brandMap]);

  const handleInputChange = (name: string, value: string) => {
    // Ensure value is always a string
    const safeValue = value === null || value === undefined ? '' : String(value);
      
    setFormData(prev => {
      const update = {
        ...prev,
        [name]: safeValue,
      };

      // Handle dependent field resets
      if (name === 'state') {
        update.district = '';
        update.city = '';
        update.sellerCity = '';
      } else if (name === 'district') {
        update.city = '';
        update.sellerCity = '';
      } else if (name === 'brand') {
        update.model = '';
      }

      return update;
    });

    // Clear any errors for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTextAreaChange = (name: string, value: string) => {
    const safeValue = value === null || value === undefined ? '' : String(value);
    setFormData(prev => ({ ...prev, [name]: safeValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('sell.permissionPhotos') || 'Please grant permission to access your photo library');
        return;
      }
      const mediaTypes = ImagePicker.MediaTypeOptions.Images;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo.${(asset.uri?.split('.')?.pop() || 'jpg')}`;
        const mimeType = asset.mimeType || 'image/jpeg';
        setFormData(prev => ({
          ...prev,
          image: {
            uri: asset.uri,
            name: fileName,
            fileName: fileName,
            type: mimeType,
            mimeType: mimeType,
          }
        }));
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: '' }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('sell.imagePickFailed') || 'Failed to pick image. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required field validation with improved error messages
    if (!formData.partName?.trim()) {
      newErrors.partName = t('sell.partNameRequired') || 'Part name is required';
    } else if (formData.partName.trim().length < 3) {
      newErrors.partName = t('sell.partNameTooShort') || 'Part name must be at least 3 characters';
    }

    if (!formData.price) {
      newErrors.price = t('sell.salePriceRequired') || 'Price is required';
    } else {
      const price = Number(formData.price);
      if (isNaN(price)) {
        newErrors.price = t('sell.priceInvalid') || 'Price must be a valid number';
      } else if (price <= 0) {
        newErrors.price = t('sell.pricePositive') || 'Price must be greater than 0';
      } else if (price > 1000000000) { // 1 billion limit
        newErrors.price = t('sell.priceTooHigh') || 'Price is too high';
      }
    }

    if (!formData.brand) {
      newErrors.brand = t('sell.carBrandRequired') || 'Car brand is required';
    }

    if (!formData.model) {
      newErrors.model = t('sell.carModelRequired') || 'Car model is required';
    }

    if (!formData.category) {
      newErrors.category = t('sell.categoryRequired') || 'Category is required';
    }

    if (!formData.year) {
      newErrors.year = t('sell.yearRequired') || 'Year is required';
    } else {
      const year = Number(formData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        newErrors.year = t('sell.yearInvalid') || `Year must be between 1900 and ${currentYear + 1}`;
      }
    }

    if (!formData.state) {
      newErrors.state = t('sell.selectState') || 'State is required';
    }

    if (!formData.district) {
      newErrors.district = t('sell.selectDistrict') || 'District is required';
    }

    // Image validation with size and format check
    if (!formData.image) {
      newErrors.image = t('sell.imageRequired') || 'Image is required';
    } else if (formData.image?.uri) {
      const asset: any = formData.image;
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { // 5MB limit
        newErrors.image = t('sell.imageTooLarge') || 'Image size should be less than 5MB';
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (asset.type && !allowedTypes.includes(asset.type)) {
        newErrors.image = t('sell.imageTypeInvalid') || 'Only JPG and PNG images are allowed';
      }
    }

    // Contact information validation
    if (!formData.sellerName?.trim()) {
      newErrors.sellerName = t('sell.sellerNameRequired') || 'Seller name is required';
    } else if (formData.sellerName.trim().length < 2) {
      newErrors.sellerName = t('sell.sellerNameTooShort') || 'Seller name must be at least 2 characters';
    }

    if (!formData.sellerPhone?.trim()) {
      newErrors.sellerPhone = t('sell.sellerPhoneRequired') || 'Phone number is required';
    } else {
      const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
      if (!phoneRegex.test(formData.sellerPhone.trim())) {
        newErrors.sellerPhone = t('sell.phoneInvalid') || 'Please enter a valid phone number';
      }
    }

    if (!formData.sellerCity) {
      newErrors.sellerCity = t('sell.sellerCityRequired') || 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate form before showing loading state
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        // Show error message for better UX
        Alert.alert(
          t('common.error') || 'Error',
          t('sell.pleaseFixErrors') || 'Please fix the highlighted errors before submitting.'
        );
      }
      return;
    }

    setIsSubmitting(true);

    if (!user || !user._id) {
      Alert.alert(t('common.error'), t('common.login') || 'Please login to continue');
      setIsSubmitting(false);
      return;
    }

    if (!backendReady) {
      Alert.alert(
        t('common.error'), 
        t('sell.backendUnavailable') || 'Backend is not reachable. Please check your internet connection and try again.'
      );
      setIsSubmitting(false);
      return;
    }

    if (!formData.image) {
      Alert.alert(
        t('common.error'), 
        t('sell.imageRequired') || 'Please select an image of your part'
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataObj = new FormData();

      // Robust file append: web uses Blob, native uses RN File object
      if (formData.image && formData.image.uri) {
        if (Platform.OS === 'web') {
          const fileResp = await fetch(formData.image.uri);
          const fileBlob = await fileResp.blob();
          formDataObj.append('image', fileBlob, formData.image.name || 'photo.jpg');
        } else {
          formDataObj.append('image', {
            uri: formData.image.uri.startsWith('file://') ? formData.image.uri : `file://${formData.image.uri}`,
            name: formData.image.name || 'photo.jpg',
            type: formData.image.type || 'image/jpeg',
          } as any);
        }
      }

      // Append other fields
      formDataObj.append('userId', user._id);
      formDataObj.append('partName', String(formData.partName || '').trim());
      formDataObj.append('brand', String(formData.brand || ''));
      formDataObj.append('category', String(formData.category || ''));
      formDataObj.append('model', String(formData.model || ''));
      formDataObj.append('year', String(formData.year || ''));
      formDataObj.append('price', String(formData.price || ''));
      formDataObj.append('state', String(formData.state || ''));
      formDataObj.append('district', String(formData.district || ''));
      formDataObj.append('city', String(formData.sellerCity || formData.city || ''));
      formDataObj.append('condition', (formData.condition || 'used').toLowerCase());
      formDataObj.append('description', String(formData.description || ''));
      formDataObj.append('stockCount', String(formData.stockCount || '1'));
      formDataObj.append('sellerName', String(formData.sellerName || ''));
      formDataObj.append('sellerPhone', String(formData.sellerPhone || ''));
      formDataObj.append('sellerCity', String(formData.sellerCity || ''));
      formDataObj.append('oem', formData.oem ? 'true' : 'false');
      formDataObj.append('specifications', JSON.stringify(formData.specifications || []));
      formDataObj.append('features', JSON.stringify(formData.features || []));

      console.log('Submitting form data:', {
        userId: user._id,
        partName: formData.partName,
        brand: formData.brand,
        category: formData.category,
        model: formData.model,
        year: formData.year,
        price: formData.price,
        state: formData.state,
        district: formData.district,
        city: formData.sellerCity || formData.city,
        condition: formData.condition,
        sellerName: formData.sellerName,
        sellerPhone: formData.sellerPhone,
        sellerCity: formData.sellerCity
      });

      const response = await fetch('https://scv2.onrender.com/api/sell', {
        method: 'POST',
        body: formDataObj,
      });

      let res: any = {};
      try {
        res = await response.json();
      } catch (_) {
        res = {};
      }

      console.log('API Response:', res);

      if (response.ok && (res?.success || res?._id || (typeof res?.message === 'string' && res?.message?.toLowerCase().includes('submitted')))) {
        try {
          const notificationId = String(res?._id || `${user._id}-${Date.now()}`);
          const title = t('sell.notification.title') || 'New Listing Created';
          const msg = t('sell.notification.message', {
            part: formData.partName || t('sell.part', 'Part')
          }) || `Your listing "${formData.partName}" was created successfully`;
          const time = new Date().toLocaleString();
          dispatch(addNotificationIfNotExists({
            id: notificationId,
            title,
            message: msg,
            time,
            type: 'system',
            read: false,
          }));
        } catch (e) {
          // best-effort notification; ignore errors
        }
        setFormData(getInitialFormData());
        setErrors({});
        setTimeout(() => {
          router.push('/sell-status');
        }, 300);
      } else {
        Alert.alert(t('common.error'), res?.message || (t('sell.submitError') as string) || 'Error submitting product');
      }
    } catch (err: any) {
      console.error('Sell POST error:', err);
      Alert.alert(t('common.error'), t('sell.serverError') || 'Server error. Please try again.');
    }
    setIsSubmitting(false);
  };

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const safeValue = value === null || value === undefined ? '' : String(value);
    const newSpecs = [...formData.specifications];
    if (newSpecs[index]) {
      newSpecs[index][field] = safeValue;
      setFormData(prev => ({ ...prev, specifications: newSpecs }));
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    const safeValue = value === null || value === undefined ? '' : String(value);
    const newFeatures = [...formData.features];
    if (newFeatures[index] !== undefined) {
      newFeatures[index] = safeValue;
      setFormData(prev => ({ ...prev, features: newFeatures }));
    }
  };

  if (!user) {
    return null;
  }

  // Wait for translations to be ready
  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.green} />
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('sell.title') || 'Sell Your Car Parts'}</Text>
          <Text style={styles.headerSubtitle}>{t('sell.subtitle') || 'Sell your automotive parts easily and securely'}</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Part Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sell.listPart') || 'List Your Car Part'}</Text>
            
            <View style={styles.formGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.partName')}</Text>
                <TextInput
                  style={[styles.input, errors.partName && styles.inputError]}
                  value={formData.partName || ''}
                  onChangeText={(value) => handleInputChange('partName', value)}
                  placeholder={t('sell.partNamePlaceholder') || 'Enter part name'}
                />
                {errors.partName && <Text style={styles.errorText}>{errors.partName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.carBrand')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.brand && styles.inputError]}>
                  <CustomDropdown
                    selectedValue={formData.brand}
                      onValueChange={(value) => handleInputChange('brand', value)}
                    items={carBrands}
                    placeholder={t('sell.selectBrand') || 'Select Brand'}
                  />
                </View>
                {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.category')} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
                  <CustomDropdown
                    selectedValue={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    items={fallbackCategories}
                    placeholder={t('sell.selectCategory') || 'Select Category'}
                  />
                </View>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.carModel') || 'Car Model'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.model && styles.inputError]}>
                  <CustomDropdown
                    selectedValue={formData.model}
                      onValueChange={(value) => handleInputChange('model', value)}
                    items={availableModels}
                    placeholder={formData.brand ? (t('sell.selectModel') || 'Select model') : (t('sell.selectBrandFirst') || 'Select brand first')}
                    enabled={!!formData.brand}
                  />
                </View>
                {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.selectYear') || 'Select Year'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.year && styles.inputError]}>
                  <CustomDropdown
                    selectedValue={formData.year}
                      onValueChange={(value) => handleInputChange('year', value)}
                    items={yearOptions}
                    placeholder={t('sell.selectYear') || 'Select Year'}
                  />
                </View>
                {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.salePrice') || 'Sale Price'} ({t('common.currency') || 'IQD'}) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  value={formData.price || ''}
                  onChangeText={(value) => handleInputChange('price', value)}
                  placeholder={t('sell.pricePlaceholder') || 'Enter price'}
                  keyboardType="numeric"
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.state') || 'State'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.state && styles.inputError]}>
                  <CustomDropdown
                    selectedValue={formData.state}
                    onValueChange={(value) => handleInputChange('state', value)}
                    items={iraqStates}
                    placeholder={t('sell.selectState') || 'Select State'}
                  />
                </View>
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.district') || 'District'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.district && styles.inputError]}>
                  <CustomDropdown
                    selectedValue={formData.district}
                    onValueChange={(value) => handleInputChange('district', value)}
                    items={availableDistricts}
                    placeholder={formData.state ? (t('sell.selectDistrict') || 'Select district') : (t('sell.selectStateFirst') || 'Select state first')}
                    enabled={!!formData.state}
                  />
                </View>
                {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.sellerCity') || 'Seller City'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.sellerCity && styles.inputError]}>
                  <CustomDropdown
                    selectedValue={formData.sellerCity}
                    onValueChange={(value) => handleInputChange('sellerCity', value)}
                    items={availableCities}
                    placeholder={formData.state ? (t('sell.selectCity') || 'Select city') : (t('sell.selectStateFirst') || 'Select state first')}
                    enabled={!!formData.state}
                  />
                </View>
                {errors.sellerCity && <Text style={styles.errorText}>{errors.sellerCity}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.sellerName') || 'Seller Name'} <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.sellerName && styles.inputError]}
                  value={formData.sellerName || ''}
                  onChangeText={(value) => handleInputChange('sellerName', value)}
                  placeholder={t('sell.sellerNamePlaceholder') || 'Enter your name'}
                />
                {errors.sellerName && <Text style={styles.errorText}>{errors.sellerName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.sellerPhone') || 'Phone Number'} <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.sellerPhone && styles.inputError]}
                  value={formData.sellerPhone || ''}
                  onChangeText={(value) => handleInputChange('sellerPhone', value)}
                  placeholder={t('sell.phoneNumberPlaceholder') || 'Enter phone number'}
                  keyboardType="phone-pad"
                />
                {errors.sellerPhone && <Text style={styles.errorText}>{errors.sellerPhone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.condition') || 'Condition'} <Text style={styles.required}>*</Text></Text>
                <View style={[styles.pickerContainer, errors.condition && styles.inputError]}>
                  <CustomDropdown
                    selectedValue={formData.condition}
                    onValueChange={(value) => handleInputChange('condition', value)}
                    items={conditionOptions}
                    placeholder={t('sell.selectCondition') || 'Select Condition'}
                  />
                </View>
                {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.stockCount') || 'Stock Count'}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stockCount || ''}
                  onChangeText={(value) => handleInputChange('stockCount', value)}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.description') || 'Description'}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description || ''}
                  onChangeText={(value) => handleTextAreaChange('description', value)}
                  placeholder={t('sell.descriptionPlaceholder') || 'Describe your part...'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('sell.image') || 'Part Image'} <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[styles.imagePickerButton, formData.image && styles.imageSelected]}
                  onPress={handleImageChange}
                >
                  {formData.image ? (
                    <View style={styles.imagePreview}>
                      <Text style={styles.imagePreviewText}>{t('sell.imageSelected', '✓ Image Selected')}</Text>
                      <Text style={styles.imageName}>{formData.image.fileName || t('sell.imageDefaultName', 'Image.jpg')}</Text>
                    </View>
                  ) : (
                    <Text style={styles.imagePickerText}>📷 {t('sell.selectImage') || 'Select Image'}</Text>
                  )}
                </TouchableOpacity>
                {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
              </View>
            </View>

            {/* Specifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('sell.specifications') || 'Specifications'}</Text>
              {formData.specifications && formData.specifications.length > 0 && formData.specifications.map((spec, idx) => (
                <View key={idx} style={styles.specRow}>
                  <TextInput
                    style={[styles.input, styles.specInput]}
                    placeholder={t('sell.specTitle') || 'Title'}
                    value={spec?.key || ''}
                    onChangeText={(value) => updateSpecification(idx, 'key', value)}
                  />
                  <TextInput
                    style={[styles.input, styles.specInput]}
                    placeholder={t('sell.specDescription') || 'Description'}
                    value={spec?.value || ''}
                    onChangeText={(value) => updateSpecification(idx, 'value', value)}
                  />
                  {formData.specifications.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeSpecification(idx)}
                  >
                    <Text style={styles.removeButtonText}>{t('common.remove') || 'Remove'}</Text>
                  </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addSpecification}>
                <Text style={styles.addButtonText}>+ {t('sell.addSpecification', 'Add Specification')}</Text>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('sell.features') || 'Features'}</Text>
              {formData.features && formData.features.length > 0 && formData.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <TextInput
                    style={[styles.input, styles.featureInput]}
                    placeholder={t('sell.feature') || 'Feature'}
                    value={feature || ''}
                    onChangeText={(value) => updateFeature(idx, value)}
                  />
                  {formData.features.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFeature(idx)}
                  >
                    <Text style={styles.removeButtonText}>{t('common.remove') || 'Remove'}</Text>
                  </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addFeature}>
                <Text style={styles.addButtonText}>+ {t('sell.addFeature', 'Add Feature')}</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.submitButtonContent}>
                  <ActivityIndicator size="small" color={colors.text.white} />
                  <Text style={styles.submitButtonText}>{t('sell.listingPart') || 'Listing Part...'}</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>{t('sell.listCarPart') || 'List Car Part'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={styles.overlay}> 
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.text.white} />
            <Text style={styles.overlayText}>{t('sell.listingPart') || 'Listing Part...'}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary.green,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.green,
    marginBottom: 16,
  },
  formGrid: {
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    minHeight: Platform.OS === 'ios' ? 44 : 48,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
    minHeight: Platform.OS === 'ios' ? 56 : 60,
    justifyContent: 'center',
  },
  picker: {
    height: Platform.OS === 'ios' ? 56 : 60,
    color: colors.text.primary,
    backgroundColor: 'transparent',
    fontSize: 18,
  },
  // Custom Dropdown Styles
  customDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    minHeight: Platform.OS === 'ios' ? 56 : 60,
  },
  customDropdownDisabled: {
    backgroundColor: colors.gray[100],
    opacity: 0.6,
  },
  customDropdownText: {
      fontSize: 16,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '400',
  },
  customDropdownPlaceholder: {
    color: colors.text.secondary,
    fontStyle: Platform.OS === 'ios' ? 'normal' : 'italic',
    opacity: Platform.OS === 'ios' ? 0.8 : 1,
  },
  customDropdownTextDisabled: {
    color: colors.gray[400],
  },
  customDropdownArrow: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 8,
  },
  customDropdownArrowDisabled: {
    color: colors.gray[400],
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.75,
    minHeight: 300,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Account for iPhone home indicator
    shadowColor: '#000',
    shadowOffset: {
    width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  dropdownList: {
    flex: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    minHeight: 56,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary.green + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.green,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  dropdownItemTextSelected: {
    color: colors.primary.green,
    fontWeight: '600',
  },
  dropdownItemCheck: {
    fontSize: 16,
    color: colors.primary.green,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    minHeight: 80,
    justifyContent: 'center',
  },
  imageSelected: {
    borderColor: colors.primary.green,
    borderStyle: 'solid',
    backgroundColor: colors.primary.green + '10',
  },
  imagePreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewText: {
    fontSize: 16,
    color: colors.primary.green,
    fontWeight: '600',
    marginBottom: 4,
  },
  imageName: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  specRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
  },
  specInput: {
    width: '100%',
    marginBottom: 6,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  featureInput: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 4 : 0,
  },
  removeButtonText: {
    color: colors.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary.green,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: colors.text.white,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary.green,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    shadowColor: colors.primary.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayCard: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  overlayText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
});

export default function SellEntry() {
  const pathname = usePathname();
  return <SellPage />;
}