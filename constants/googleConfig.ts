// Google Sign-In Configuration
// Replace these values with your actual Google Cloud Console credentials

export const GOOGLE_CONFIG = {
  // Web Client ID from Google Cloud Console
  // For Expo Auth Session, this should be the same as your Android client ID for development
  WEB_CLIENT_ID: '48290293482-pd5m2q52dhs1dolt9sjkta2edi15kp06.apps.googleusercontent.com',
  
  // Android Client ID (for native Android builds)
  ANDROID_CLIENT_ID: '48290293482-pd5m2q52dhs1dolt9sjkta2edi15kp06.apps.googleusercontent.com',
  
  // iOS Client ID (for native iOS builds)
  IOS_CLIENT_ID: '48290293482-d5jeth2q7arc8h3rfmb8bp47juic80l7.apps.googleusercontent.com',
};

// Helper function to get the appropriate client ID for the current platform
export const getGoogleClientId = (platform: 'web' | 'android' | 'ios' = 'web') => {
  switch (platform) {
    case 'android':
      return GOOGLE_CONFIG.ANDROID_CLIENT_ID;
    case 'ios':
      return GOOGLE_CONFIG.IOS_CLIENT_ID;
    case 'web':
    default:
      return GOOGLE_CONFIG.WEB_CLIENT_ID;
  }
};

// Development helper - shows warning if using placeholder values
export const validateGoogleConfig = () => {
  if (GOOGLE_CONFIG.WEB_CLIENT_ID === 'YOUR_WEB_CLIENT_ID_HERE') {
    console.warn('⚠️ Google Sign-In not configured! Please update constants/googleConfig.ts with your actual Client IDs');
    return false;
  }
  return true;
};
