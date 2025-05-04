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
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    //TODO: Add canActivate: [AuthGuard] to protect this route
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'tool-details/:id',
    loadComponent: () => import('./features/tool/components/tool-details/tool-details.component').then(m => m.ToolDetailsComponent)
  }
];
