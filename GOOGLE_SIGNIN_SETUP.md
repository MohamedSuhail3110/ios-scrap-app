# Google Sign-In Setup Guide (Updated for Web + Mobile)

## 🎯 What's New
- ✅ **Web Support**: Now works on both web and mobile platforms
- ✅ **Automatic Platform Detection**: Automatically uses the right method for each platform
- ✅ **Easy Configuration**: Single configuration file for all platforms

## 1. Install Required Packages

```bash
npm install @react-native-google-signin/google-signin
```

## 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sign-In API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"

### Create Multiple Client IDs:

#### Web Client ID:
- Choose "Web application"
- Add authorized JavaScript origins:
  - `http://localhost:8081` (for development)
  - `http://localhost:19006` (for Expo web)
  - Your production domain
- Copy the Client ID

#### Android Client ID:
- Choose "Android"
- Add your package name (e.g., `com.yourcompany.scrapmobile`)
- Generate SHA-1 fingerprint
- Copy the Client ID

#### iOS Client ID (optional):
- Choose "iOS"
- Add your bundle identifier
- Copy the Client ID

## 3. Update Configuration

Edit `constants/googleConfig.ts`:

```typescript
export const GOOGLE_CONFIG = {
  WEB_CLIENT_ID: '123456789-abcdef.apps.googleusercontent.com', // Your Web Client ID
  ANDROID_CLIENT_ID: '123456789-ghijkl.apps.googleusercontent.com', // Your Android Client ID
  IOS_CLIENT_ID: '123456789-mnopqr.apps.googleusercontent.com', // Your iOS Client ID
};
```

## 4. Generate SHA-1 Fingerprint (Android)

### For Development:
```bash
cd android && ./gradlew signingReport
```

### For Production:
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

## 5. Platform-Specific Setup

### Web Platform:
- ✅ **Already configured** - Uses Google Identity Services
- ✅ **Automatic script loading** - No additional setup needed
- ✅ **Works in browsers** - Test on localhost or production

### Android Platform:
- ✅ **Already configured** - Uses React Native Google Sign-In
- ✅ **Automatic Play Services check** - Built-in error handling
- ✅ **SHA-1 fingerprint** - Required in Google Cloud Console

### iOS Platform:
- ✅ **Already configured** - Uses React Native Google Sign-In
- ✅ **Bundle identifier** - Required in Google Cloud Console

## 6. Testing

### Web Testing:
1. Run `npm run dev` or `expo start --web`
2. Navigate to signin page
3. Click "Sign in with Google"
4. Choose Google account
5. Verify backend receives request

### Mobile Testing:
1. Run `expo start` or `expo run:android/ios`
2. Navigate to signin page
3. Click "Sign in with Google"
4. Complete Google Sign-In flow
5. Verify backend receives request

## 7. Backend Integration

Your backend is already set up with:
- Route: `POST /api/auth/google`
- Controller: `googleAuthCallback` in `googleAuthController.js`
- Handles both new user creation and existing user login

## 8. Troubleshooting

### Web Issues:
- **Script not loading**: Check internet connection and firewall
- **Popup blocked**: Allow popups for your domain
- **Client ID mismatch**: Verify WEB_CLIENT_ID in googleConfig.ts

### Mobile Issues:
- **SHA-1 mismatch**: Regenerate fingerprint
- **Package name mismatch**: Check AndroidManifest.xml
- **Play Services**: Update Google Play Services

### Common Errors:
- **"Google Sign-In not available"**: Check platform detection
- **"Client ID not configured"**: Update googleConfig.ts
- **"Backend error"**: Check server logs and API endpoint

## 9. Production Deployment

### Web:
- Update authorized origins in Google Cloud Console
- Use HTTPS in production
- Test on production domain

### Mobile:
- Use release keystore for SHA-1
- Update bundle identifier for iOS
- Test on real devices

## 10. Security Best Practices

- ✅ **Client IDs are public** - Safe to include in app
- ✅ **Backend validation** - Always verify tokens on server
- ✅ **HTTPS required** - For production web deployment
- ✅ **Token expiration** - JWT tokens expire automatically

## 🚀 Ready to Use!

Your Google Sign-In now works on:
- ✅ **Web browsers** (Chrome, Firefox, Safari, Edge)
- ✅ **Android devices** (with Google Play Services)
- ✅ **iOS devices** (with proper configuration)
- ✅ **Development and production**

Just update the `constants/googleConfig.ts` file with your actual Client IDs and you're ready to go!
