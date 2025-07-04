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
Sprawdza czy użytkownik ma rolę ADMIN.

**Użycie:**
```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [adminGuard]
}
```

### 3. ModeratorGuard (`moderator.guard.ts`)
Sprawdza czy użytkownik ma rolę MODERATOR lub ADMIN.

**Użycie:**
```typescript
{
  path: 'moderator',
  component: ModeratorComponent,
  canActivate: [moderatorGuard]
}
```

## Jak działają

1. **AuthGuard** - sprawdza czy użytkownik jest zalogowany używając `AuthService.isLogged()`
2. **AdminGuard** - sprawdza czy użytkownik ma rolę ADMIN
3. **ModeratorGuard** - sprawdza czy użytkownik ma rolę MODERATOR lub ADMIN

## Bezpieczeństwo

- Guardy działają po stronie klienta i nie zastępują zabezpieczeń serwera
- Zawsze implementuj odpowiednie zabezpieczenia na backendzie
- JWT tokeny są sprawdzane przy każdym żądaniu do chronionych routów
- Wygasłe tokeny automatycznie wylogowują użytkownika 
