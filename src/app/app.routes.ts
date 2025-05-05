import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'register',
    loadComponent: () => import('./features/auth/components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./features/auth/components/change-password/change-password.component').then(m => m.ChangePasswordComponent)
    //TODO: Add canActivate: [AuthGuard] to protect this route
  },
  {
    path: '',
    redirectTo: 'tools',
    pathMatch: 'full'
  },
  {
    path: 'tool/:id',
    loadComponent: () => import('./features/tool/components/tool-details/tool-details.component').then(m => m.ToolDetailsComponent)
  },
  {
    path: 'tools',
    loadComponent: () => import('./features/tool/components/tools-list/tools-list.component').then(m => m.ToolsListComponent)
  },
];
