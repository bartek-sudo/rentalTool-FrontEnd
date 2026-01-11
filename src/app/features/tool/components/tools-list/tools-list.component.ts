import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToolService } from '../../services/tool.service';
import { Subject, takeUntil } from 'rxjs';
import { Tool } from '../../models/tool.model';
import { CategoryName } from '../../models/category.model';

declare var google: any;

@Component({
  selector: 'app-tools-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './tools-list.component.html',
  styles: [`
    #map {
      height: 600px;
      width: 100%;
      border-radius: 0.5rem;
      z-index: 0;
    }

    @media (max-width: 768px) {
      #map {
        height: 400px;
      }
    }

    @media (max-width: 480px) {
      #map {
        height: 300px;
      }
    }
  `]
})
export class ToolsListComponent implements OnInit, OnDestroy {
  tools: Tool[] = [];
  isLoading = false;
  searchTerm = '';
  selectedCategory: string = '';
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;
  selectedSort = 'created_desc'; // Domyślnie najnowsze (utworzone ostatnio)
  Math = Math;

  // Parametry geolokalizacji
  userLatitude?: number;
  userLongitude?: number;
  selectedRadius: number | null = 50; // Domyślnie 50 km
  isGeolocationEnabled = false;
  isLoadingLocation = false;
  geolocationError = '';
  radiusOptions = [
    { value: 10, label: '10 km' },
    { value: 25, label: '25 km' },
    { value: 50, label: '50 km' },
    { value: 100, label: '100 km' },
    { value: null, label: 'Wszystkie' }
  ];

  // Mapa Google Maps
  private map?: any;
  private userMarker?: any;
  private toolMarkers: any[] = [];
  private radiusCircle?: any;

  // Dostępne kategorie
  categories = [
    { value: '', label: 'Wszystkie kategorie' },
    { value: CategoryName.GARDENING, label: 'Ogród' },
    { value: CategoryName.CONSTRUCTION, label: 'Budowa' },
    { value: CategoryName.ELECTRIC, label: 'Elektryka' },
    { value: CategoryName.PLUMBING, label: 'Hydraulika' },
    { value: CategoryName.AUTOMOTIVE, label: 'Motoryzacja' },
    { value: CategoryName.PAINTING, label: 'Malowanie' },
    { value: CategoryName.CLEANING, label: 'Sprzątanie' },
    { value: CategoryName.WOODWORKING, label: 'Stolarstwo' },
    { value: CategoryName.METALWORKING, label: 'Obróbka metalu' },
    { value: CategoryName.OUTDOOR, label: 'Sprzęt na zewnątrz' },
    { value: CategoryName.OTHER, label: 'Inne' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private toolService: ToolService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Automatycznie pobierz lokalizację użytkownika przy starcie
    this.getUserLocation();

    // Subskrypcja na zmiany parametrów zapytania
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.searchTerm = params['search'] || '';
      this.selectedCategory = params['category'] || '';
      this.currentPage = parseInt(params['page']) || 0;
      this.loadTools();
    });

    // Subskrypcja na zmiany wyszukiwania
    this.toolService.searchTerm$.pipe(takeUntil(this.destroy$)).subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
        this.currentPage = 0;
        this.loadTools();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Cleanup mapy Google Maps
    if (this.map) {
      this.toolMarkers.forEach(marker => marker.setMap(null));
      if (this.userMarker) this.userMarker.setMap(null);
      if (this.radiusCircle) this.radiusCircle.setMap(null);
      this.map = null;
    }
  }

  loadTools() {
    this.isLoading = true;
    const [sortBy, sortDirection] = this.getSortParams();

    // Jeśli geolokalizacja jest włączona, używamy lokalizacji użytkownika
    const latitude = this.isGeolocationEnabled ? this.userLatitude : undefined;
    const longitude = this.isGeolocationEnabled ? this.userLongitude : undefined;
    const radius = this.isGeolocationEnabled ? this.selectedRadius : undefined;

    this.toolService.searchTools(
      this.searchTerm,
      this.currentPage,
      this.pageSize,
      sortBy,
      sortDirection,
      this.selectedCategory || undefined,
      latitude,
      longitude,
      radius
    ).subscribe({
      next: (response) => {
        this.tools = response.data.tools;
        this.totalPages = response.data.totalPages;
        this.totalItems = response.data.totalItems;
        this.isLoading = false;

        // Zaktualizuj markery na mapie
        if (this.isGeolocationEnabled && this.map) {
          this.updateMapMarkers();
        }
      },
      error: (error) => {
        console.error('Error loading tools:', error);
        this.isLoading = false;

        // Jeśli 401 przy geolokalizacji, wyłącz ją i załaduj bez geolokalizacji
        if (error.status === 401 && this.isGeolocationEnabled) {
          console.warn('Endpoint wymaga autoryzacji. Ładowanie narzędzi bez geolokalizacji...');
          this.geolocationError = 'Wyszukiwanie z geolokalizacją wymaga zalogowania. Wyświetlanie wszystkich narzędzi.';
          this.isGeolocationEnabled = false;
          this.loadTools(); // Spróbuj ponownie bez geolokalizacji
        }
      }
    });
  }

  getUserLocation() {
    if (navigator.geolocation) {
      this.isLoadingLocation = true;
      this.geolocationError = '';

      const options = {
        enableHighAccuracy: true, // Większa dokładność
        timeout: 15000, // 15 sekund timeout
        maximumAge: 0 // Nie używaj cache, zawsze pobieraj świeżą lokalizację
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Lokalizacja pobrana:', position.coords.latitude, position.coords.longitude);
          this.userLatitude = position.coords.latitude;
          this.userLongitude = position.coords.longitude;
          this.isGeolocationEnabled = true;
          this.geolocationError = '';
          this.isLoadingLocation = false;
          this.currentPage = 0; // Reset do pierwszej strony

          // Zmień domyślne sortowanie na odległość gdy geolokalizacja jest włączona
          this.selectedSort = 'distance_asc';

          // Inicjalizuj mapę po małym opóźnieniu (aby DOM był gotowy)
          setTimeout(() => {
            this.initMap();
          }, 100);

          this.loadTools(); // Przeładuj narzędzia z geolokalizacją
        },
        (error) => {
          console.error('Błąd geolokalizacji:', error);
          this.isLoadingLocation = false;
          let errorMessage = '';

          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Aby zobaczyć narzędzia w Twojej okolicy na mapie, musisz zezwolić na dostęp do lokalizacji.\n\nKliknij ikonę lokalizacji w pasku adresu przeglądarki i wybierz "Zezwól", a następnie kliknij przycisk "Włącz lokalizację" ponownie.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Lokalizacja niedostępna. Upewnij się, że:\n• Masz włączone usługi lokalizacji w Windows (Ustawienia → Prywatność → Lokalizacja)\n• Przeglądarka ma dostęp do lokalizacji\n• Jesteś podłączony do Wi-Fi lub masz włączony GPS';
              break;
            case error.TIMEOUT:
              errorMessage = 'Przekroczono czas oczekiwania na lokalizację. Spróbuj ponownie.';
              break;
            default:
              errorMessage = 'Nie udało się pobrać lokalizacji. Spróbuj ponownie później.';
          }

          this.geolocationError = errorMessage;
          this.isGeolocationEnabled = false;

          // Wyczyść dane lokalizacji
          this.userLatitude = undefined;
          this.userLongitude = undefined;

          // Usuń mapę jeśli istnieje
          if (this.map) {
            this.toolMarkers.forEach(marker => marker.setMap(null));
            if (this.userMarker) this.userMarker.setMap(null);
            if (this.radiusCircle) this.radiusCircle.setMap(null);
            this.map = null;
          }

          // Nie ładuj narzędzi jeśli użytkownik odmówił dostępu - po prostu pokaż komunikat
          if (error.code !== error.PERMISSION_DENIED) {
            // Dla innych błędów (timeout, unavailable) - załaduj wszystkie narzędzia
            this.loadTools();
          }
        },
        options
      );
    } else {
      this.geolocationError = 'Twoja przeglądarka nie obsługuje geolokalizacji.';
      this.isGeolocationEnabled = false;
    }
  }

  toggleGeolocation() {
    if (this.isGeolocationEnabled) {
      // Wyłącz geolokalizację
      this.isGeolocationEnabled = false;
      this.currentPage = 0;

      // Przywróć domyślne sortowanie (najnowsze) gdy geolokalizacja jest wyłączona
      if (this.selectedSort === 'distance_asc' || this.selectedSort === 'distance_desc') {
        this.selectedSort = 'created_desc';
      }

      // Usuń mapę Google Maps
      if (this.map) {
        this.toolMarkers.forEach(marker => marker.setMap(null));
        if (this.userMarker) this.userMarker.setMap(null);
        if (this.radiusCircle) this.radiusCircle.setMap(null);
        this.map = null;
      }

      this.loadTools();
    } else {
      // Włącz geolokalizację
      this.getUserLocation();
    }
  }

  updateRadius() {
    if (this.isGeolocationEnabled) {
      this.currentPage = 0;
      this.updateRadiusCircle(); // Zaktualizuj okrąg na mapie
      this.loadTools();
      this.updateQueryParams();
    }
  }

  updateSort() {
    this.currentPage = 0;
    this.loadTools();
    this.updateQueryParams();
  }

  updateCategory() {
    this.currentPage = 0;
    this.loadTools();
    this.updateQueryParams();
  }

  updateQueryParams() {
    const queryParams: any = {
      page: this.currentPage,
      search: this.searchTerm || null,
      category: this.selectedCategory || null
    };

    // Usuń null values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === null) {
        delete queryParams[key];
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
  }

  getSortParams(): [string, string] {
    switch (this.selectedSort) {
      case 'name_asc':
        return ['name', 'asc'];
      case 'name_desc':
        return ['name', 'desc'];
      case 'price_asc':
        return ['pricePerDay', 'asc'];
      case 'price_desc':
        return ['pricePerDay', 'desc'];
      case 'distance_asc':
        return ['distance', 'asc'];
      case 'distance_desc':
        return ['distance', 'desc'];
      case 'created_asc':
        return ['createdAt', 'asc'];
      case 'created_desc':
      default:
        return ['createdAt', 'desc'];
    }
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updateQueryParams();
    }
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  // Metody obsługi mapy Google Maps
  initMap() {
    if (!this.userLatitude || !this.userLongitude || typeof google === 'undefined') return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Inicjalizuj mapę Google Maps
    this.map = new google.maps.Map(mapElement, {
      center: { lat: this.userLatitude, lng: this.userLongitude },
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });

    // Dodaj marker użytkownika (niebieski)
    this.userMarker = new google.maps.Marker({
      position: { lat: this.userLatitude, lng: this.userLongitude },
      map: this.map,
      title: 'Twoja lokalizacja',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    // Info window dla użytkownika
    const userInfoWindow = new google.maps.InfoWindow({
      content: '<div style="padding: 8px;"><strong>Twoja lokalizacja</strong></div>'
    });

    this.userMarker.addListener('click', () => {
      userInfoWindow.open(this.map, this.userMarker);
    });

    // Dodaj okrąg promienia (jeśli ustawiony)
    if (this.selectedRadius !== null) {
      this.radiusCircle = new google.maps.Circle({
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        map: this.map,
        center: { lat: this.userLatitude, lng: this.userLongitude },
        radius: this.selectedRadius * 1000 // konwersja km na metry
      });
    }

    // Dodaj markery narzędzi
    this.updateMapMarkers();
  }

  updateMapMarkers() {
    if (!this.map || typeof google === 'undefined') return;

    // Usuń stare markery narzędzi
    this.toolMarkers.forEach(marker => marker.setMap(null));
    this.toolMarkers = [];

    const bounds = new google.maps.LatLngBounds();

    // Dodaj marker użytkownika do bounds
    if (this.userMarker) {
      bounds.extend(this.userMarker.getPosition());
    }

    // Dodaj markery dla każdego narzędzia z lokalizacją
    this.tools.forEach(tool => {
      if (tool.latitude && tool.longitude) {
        const marker = new google.maps.Marker({
          position: { lat: tool.latitude, lng: tool.longitude },
          map: this.map,
          title: tool.name,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });

        const distanceText = tool.distance !== null && tool.distance !== undefined
          ? `<p style="margin: 4px 0;"><strong>Odległość:</strong> ${tool.distance.toFixed(1)} km</p>`
          : '';

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="min-width: 200px; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${tool.name}</h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${tool.description.substring(0, 100)}${tool.description.length > 100 ? '...' : ''}</p>
              <p style="margin: 0 0 4px 0;"><strong>Cena:</strong> ${tool.pricePerDay} zł/dzień</p>
              ${distanceText}
              <a href="/tool/${tool.id}" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #4285F4; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">Zobacz szczegóły</a>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(this.map, marker);
        });

        this.toolMarkers.push(marker);
        bounds.extend(marker.getPosition());
      }
    });

    // Dopasuj widok mapy do wszystkich markerów
    if (this.toolMarkers.length > 0 || this.userMarker) {
      this.map.fitBounds(bounds);
    }
  }

  updateRadiusCircle() {
    if (!this.map || !this.userLatitude || !this.userLongitude || typeof google === 'undefined') return;

    // Usuń stary okrąg
    if (this.radiusCircle) {
      this.radiusCircle.setMap(null);
      this.radiusCircle = null;
    }

    // Dodaj nowy okrąg (jeśli promień jest ustawiony)
    if (this.selectedRadius !== null) {
      this.radiusCircle = new google.maps.Circle({
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        map: this.map,
        center: { lat: this.userLatitude, lng: this.userLongitude },
        radius: this.selectedRadius * 1000 // konwersja km na metry
      });
    }
  }

  getPageNumbers(): number[] {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  }
}
