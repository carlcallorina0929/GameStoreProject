import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptor/auth.interceptor';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { provideNzIcons } from 'ng-zorro-antd/icon';

import {
  HomeOutline,
  AppstoreOutline,
  BookOutline,
  ShoppingCartOutline,
  UserOutline,
  SettingOutline,
  LogoutOutline
} from '@ant-design/icons-angular/icons';
provideNzIcons([
  HomeOutline,
  AppstoreOutline,
  BookOutline,
  ShoppingCartOutline,
  UserOutline,
  SettingOutline,
  LogoutOutline
]),

registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    provideHttpClient(withInterceptors([authInterceptor])),
    provideNzI18n(en_US),
  ],
};
