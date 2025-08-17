import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types/product';

interface ProductsState {
  products: Product[];
  trendingProducts: Product[];
  selectedCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  trendingProducts: [],
  selectedCategory: null,
  searchQuery: '',
  isLoading: false,
  error: null
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
      state.isLoading = false;
    },
    setTrendingProducts: (state, action: PayloadAction<Product[]>) => {
      state.trendingProducts = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  }
});

export const {
  setLoading,
  setProducts,
  setTrendingProducts,
  setSelectedCategory,
  setSearchQuery,
  setError
} = productsSlice.actions;

export default productsSlice.reducer;