# Guardy do zabezpieczenia routów

## Opis

Ten katalog zawiera guardy do zabezpieczenia routów w aplikacji Angular. Guardy sprawdzają uprawnienia użytkownika przed pozwoleniem na dostęp do chronionych stron.

## Dostępne guardy

### 1. AuthGuard (`auth.guard.ts`)
Sprawdza czy użytkownik jest zalogowany.

**Użycie:**
```typescript
{
  path: 'protected-route',
  component: ProtectedComponent,
  canActivate: [authGuard]
}
```

### 2. AdminGuard (`admin.guard.ts`)
Sprawdza czy użytkownik ma rolę ADMIN lub ROLE_ADMIN.

**Użycie:**
```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [adminGuard]
}
```

### 3. RoleGuard (`role.guard.ts`)
Sprawdza czy użytkownik ma określone role. Role są definiowane w danych routa.

**Użycie:**
```typescript
{
  path: 'admin-only',
  component: AdminOnlyComponent,
  canActivate: [roleGuard],
  data: { roles: ['ADMIN', 'MODERATOR'] }
}
```

## Jak działają

1. **AuthGuard** - sprawdza czy użytkownik jest zalogowany używając `AuthService.isLogged()`
2. **AdminGuard** - sprawdza role z JWT tokena używając `TokenService.getRoles()`
3. **RoleGuard** - sprawdza czy użytkownik ma którąkolwiek z wymaganych ról

## Role w JWT tokenie

Guardy oczekują, że role są przechowywane w JWT tokenie w polu `authorities` jako tablica stringów. Obsługiwane formaty:
- `ADMIN`
- `ROLE_ADMIN`
- `MODERATOR`
- `ROLE_MODERATOR`

## Przykłady routów

```typescript
export const routes: Routes = [
  // Publiczne routy
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Chronione routy - wymagają logowania
  { 
    path: 'profile', 
    component: ProfileComponent, 
    canActivate: [authGuard] 
  },
  
  // Admin routy - wymagają roli admin
  { 
    path: 'admin', 
    component: AdminComponent, 
    canActivate: [adminGuard] 
  },
  
  // Ruty z określonymi rolami
  { 
    path: 'moderator', 
    component: ModeratorComponent, 
    canActivate: [roleGuard],
    data: { roles: ['MODERATOR', 'ADMIN'] }
  }
];
```

## Bezpieczeństwo

- Guardy działają po stronie klienta i nie zastępują zabezpieczeń serwera
- Zawsze implementuj odpowiednie zabezpieczenia na backendzie
- JWT tokeny są sprawdzane przy każdym żądaniu do chronionych routów
- Wygasłe tokeny automatycznie wylogowują użytkownika 
