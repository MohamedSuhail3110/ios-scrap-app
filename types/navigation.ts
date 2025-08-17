import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  '(tabs)': undefined;
  Login: undefined;
  Signup: undefined;
  ProductDetails: { productId: string };
  EditProfile: undefined;
};

export type TabParamList = {
  index: undefined;
  buy: undefined;
  sell: undefined;
  settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}