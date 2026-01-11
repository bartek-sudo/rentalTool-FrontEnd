import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { moderatorGuard } from './core/guards/moderator.guard';

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
    path: 'verify-email',
    loadComponent: () => import('./features/auth/components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
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
    loadComponent: () => import('./features/tool/components/my-tools/my-tools.component').then(m => m.MyToolsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create-tool',
    loadComponent: () => import('./features/tool/components/create-tool/create-tool.component').then(m => m.CreateToolComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit-tool/:id',
    loadComponent: () => import('./features/tool/components/edit-tool/edit-tool.component').then(m => m.EditToolComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-rentals',
    loadComponent: () => import('./features/reservation/components/my-rentals/my-rentals.component').then(m => m.MyRentalsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'accept-regulations/:id',
    loadComponent: () => import('./features/reservation/components/accept-regulations/accept-regulations.component').then(m => m.AcceptRegulationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-tool-reservations',
    loadComponent: () => import('./features/reservation/components/my-tool-reservations/my-tool-reservations.component').then(m => m.MyToolReservationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'account-settings',
    loadComponent: () => import('./features/user/components/account-settings/account-settings.component').then(m => m.AccountSettingsComponent),
    canActivate: [authGuard]
  },
  // Admin routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/components/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'tools',
        loadComponent: () => import('./features/moderator/components/tool-management/tool-management.component').then(m => m.ToolManagementComponent)
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/moderator/components/reservation-management/reservation-management.component').then(m => m.ReservationManagementComponent)
      },
      {
        path: 'terms',
        loadComponent: () => import('./features/admin/components/terms-management/terms-management.component').then(m => m.TermsManagementComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/components/category-management/category-management.component').then(m => m.CategoryManagementComponent)
      }
    ]
  },
  // Moderator routes - używają tych samych komponentów co admin
  {
    path: 'moderator',
    canActivate: [moderatorGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/moderator/components/moderator-dashboard/moderator-dashboard.component').then(m => m.ModeratorDashboardComponent)
      },
      {
        path: 'tools',
        loadComponent: () => import('./features/moderator/components/tool-management/tool-management.component').then(m => m.ToolManagementComponent)
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/moderator/components/reservation-management/reservation-management.component').then(m => m.ReservationManagementComponent)
      }
    ]
  }
];
