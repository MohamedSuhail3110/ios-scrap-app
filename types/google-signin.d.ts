declare module '@react-native-google-signin/google-signin' {
  export interface GoogleSigninUser {
    id: string;
    email: string;
    name: string;
    photo?: string;
  }

  export interface SignInResponse {
    user: GoogleSigninUser;
  }

  export interface GoogleSignin {
    configure(config: {
      webClientId: string;
      offlineAccess?: boolean;
      forceCodeForRefreshToken?: boolean;
    }): void;
    
    hasPlayServices(): Promise<boolean>;
    signIn(): Promise<SignInResponse>;
    signOut(): Promise<void>;
    isSignedIn(): Promise<boolean>;
    getCurrentUser(): Promise<GoogleSigninUser | null>;
  }

  export const GoogleSignin: GoogleSignin;
}
