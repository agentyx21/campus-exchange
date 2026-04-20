import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'listing/:id',
    loadComponent: () => import('./pages/listing-detail/listing-detail').then(m => m.ListingDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'create-listing',
    loadComponent: () => import('./pages/create-listing/create-listing').then(m => m.CreateListingComponent),
    canActivate: [authGuard],
  },
  {
    path: 'edit-listing/:id',
    loadComponent: () => import('./pages/edit-listing/edit-listing').then(m => m.EditListingComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'messages',
    loadComponent: () => import('./pages/messages/messages').then(m => m.MessagesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then(m => m.AdminComponent),
    canActivate: [adminGuard],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFoundComponent),
  },
];
