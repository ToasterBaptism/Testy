/**
 * Navigation type definitions for FortniteAssist
 */

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Permissions: undefined;
  Help: undefined;
  About: undefined;
  Diagnostics: undefined;
};

export type ScreenNames = keyof RootStackParamList;