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
  {
    path: 'my-tools',
    loadComponent: () => import('./features/tool/components/my-tools/my-tools.component').then(m => m.MyToolsComponent)
  },
  {
    path: 'create-tool',
    loadComponent: () => import('./features/tool/components/create-tool/create-tool.component').then(m => m.CreateToolComponent)
  },
  {
    path: 'my-rentals',
    loadComponent: () => import('./features/reservation/components/my-rentals/my-rentals.component').then(m => m.MyRentalsComponent)
  },
  {
    path: 'my-tool-reservations',
    loadComponent: () => import('./features/reservation/components/my-tool-reservations/my-tool-reservations.component').then(m => m.MyToolReservationsComponent)
  }
];
