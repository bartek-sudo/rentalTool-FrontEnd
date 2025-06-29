import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToolService } from '../../services/tool.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/enviroment';
import { Category } from '../../models/category.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';

// Definicje interfejsów dla Google Maps
interface GoogleMapPosition {
  lat: number;
  lng: number;
}

interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

interface GoogleMapOptions {
  center: GoogleMapPosition;
  zoom: number;
  mapTypeControl: boolean;
  streetViewControl: boolean;
  fullscreenControl: boolean;
  zoomControl?: boolean;
}

interface GoogleMarkerOptions {
  position: GoogleMapPosition;
  map: any;
  draggable: boolean;
  animation?: number;
}

interface GoogleGeocodeRequest {
  location: GoogleMapPosition;
}

interface GoogleGeocodeResult {
  formatted_address: string;
}

// Interface dla podglądu nowych zdjęć
interface ImagePreview {
  file: File;
  url: string;
  isMain: boolean;
}

// Interface dla istniejących zdjęć
interface ToolImage {
  id: number;
  url: string;
  filename: string;
  contentType: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-edit-tool',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-tool.component.html',
  styleUrl: './edit-tool.component.css'
})
export class EditToolComponent {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('addressInput') addressInput!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  toolForm: FormGroup;
  isSubmitting: boolean = false;
  isLoadingLocation: boolean = false;
  isLoadingTool: boolean = false;
  isLoadingImages: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  toolId: number = 0;
  currentTool: any = null;

  // Kategorie zgodne z backendem
  categories = Object.values(Category);

  // Zmienne dla zdjęć
  existingImages: ToolImage[] = [];
  selectedNewImages: ImagePreview[] = [];
  maxImages: number = 10;
  maxFileSize: number = 5 * 1024 * 1024; // 5MB
  allowedFileTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];
  isDragOver: boolean = false;

  private googleMapsApiKey = environment.googleMapsApiKey;
  // Zmienne mapy
  private map: any = null;
  private marker: any = null;
  private geocoder: any = null;
  private autocomplete: any = null;

  constructor(
    private fb: FormBuilder,
    private toolService: ToolService,
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2
  ) {
    this.toolForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      category: ['', Validators.required],
      pricePerDay: [null, [Validators.required, Validators.min(1)]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // Pobierz ID narzędzia z parametrów routingu
    this.route.params.subscribe(params => {
      this.toolId = +params['id'];
      if (this.toolId) {
        this.loadToolData();
        this.loadToolImages();
      } else {
        this.errorMessage = 'Nieprawidłowy identyfikator narzędzia';
      }
    });

    // Dodanie skryptu Google Maps do strony
    this.loadGoogleMapsScript();

    // Nasłuchiwanie na zmiany w polu adresu
    this.toolForm.get('address')?.valueChanges
      .pipe(
        debounceTime(1000), // Opóźnienie 1 sekunda
        distinctUntilChanged() // Pomija identyczne wartości
      )
      .subscribe(address => {
        if (address && address.length > 5 && !this.isAddressFromMarker) {
          this.geocodeAddress(address);
        }
      });
  }

  // Flaga, która zapobiega zapętleniu geocodingu
  private isAddressFromMarker = false;

  ngAfterViewInit(): void {
    // Mapa zostanie załadowana po załadowaniu skryptu Google Maps
  }

  private loadToolData(): void {
    this.isLoadingTool = true;
    this.toolService.getToolById(this.toolId).subscribe({
      next: (tool) => {
        this.currentTool = tool;
        this.populateForm();
        this.isLoadingTool = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Nie udało się załadować danych narzędzia';
        this.isLoadingTool = false;
      }
    });
  }

  private loadToolImages(): void {
    this.isLoadingImages = true;
    this.toolService.getToolImages(this.toolId).subscribe({
      next: (response) => {
        this.existingImages = response.data.images || [];
        this.isLoadingImages = false;
      },
      error: (error) => {
        console.error('Błąd podczas ładowania zdjęć:', error);
        this.isLoadingImages = false;
      }
    });
  }

  private populateForm(): void {
    if (this.currentTool) {
      this.toolForm.patchValue({
        name: this.currentTool.name,
        description: this.currentTool.description,
        category: this.currentTool.category,
        pricePerDay: this.currentTool.pricePerDay,
        address: this.currentTool.address,
        latitude: this.currentTool.latitude,
        longitude: this.currentTool.longitude,
        isActive: this.currentTool.isActive
      });

      // Zaktualizuj mapę jeśli jest już załadowana
      if (this.map && this.marker) {
        this.updateMapWithToolLocation();
      }
    }
  }

  // ========== METODY DO OBSŁUGI ZDJĘĆ ==========

  onFileSelect(event: any): void {
    const files = event.target.files;
    this.handleFiles(files);
    // Resetuj input aby można było wybrać te same pliki ponownie
    event.target.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  private handleFiles(files: FileList): void {
    const totalImages = this.existingImages.length + this.selectedNewImages.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!this.validateFile(file)) {
        continue;
      }

      if (totalImages + i >= this.maxImages) {
        this.errorMessage = `Możesz mieć maksymalnie ${this.maxImages} zdjęć.`;
        break;
      }

      // Sprawdź czy plik już nie został dodany
      if (this.selectedNewImages.some(img =>
          img.file.name === file.name &&
          img.file.size === file.size &&
          img.file.lastModified === file.lastModified)) {
        continue;
      }

      // Utwórz URL do podglądu
      const reader = new FileReader();
      reader.onload = (e) => {
        const imagePreview: ImagePreview = {
          file: file,
          url: e.target?.result as string,
          isMain: false // Nowe zdjęcia domyślnie nie są główne
        };
        this.selectedNewImages.push(imagePreview);
        this.errorMessage = '';
      };
      reader.readAsDataURL(file);
    }
  }

  private validateFile(file: File): boolean {
    // Sprawdź typ pliku
    if (!this.allowedFileTypes.includes(file.type)) {
      this.errorMessage = 'Dozwolone są tylko pliki JPG, PNG i WebP.';
      return false;
    }

    // Sprawdź rozmiar pliku
    if (file.size > this.maxFileSize) {
      this.errorMessage = 'Plik jest za duży. Maksymalny rozmiar to 5MB.';
      return false;
    }

    return true;
  }

  removeNewImage(index: number): void {
    this.selectedNewImages.splice(index, 1);
    this.errorMessage = '';
  }

  removeExistingImage(image: ToolImage): void {
    if (confirm('Czy na pewno chcesz usunąć to zdjęcie? Ta operacja jest nieodwracalna.')) {
      this.toolService.deleteToolImage(this.toolId, image.id).subscribe({
        next: () => {
          this.existingImages = this.existingImages.filter(img => img.id !== image.id);
          this.successMessage = 'Zdjęcie zostało usunięte';
          // setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = 'Nie udało się usunąć zdjęcia';
          console.error('Błąd podczas usuwania zdjęcia:', error);
        }
      });
    }
  }

  setExistingImageAsMain(image: ToolImage): void {
    if (image.isMain) return;

    this.toolService.setMainImage(this.toolId, image.id).subscribe({
      next: () => {
        // Zaktualizuj stan lokalnie
        this.existingImages.forEach(img => img.isMain = false);
        image.isMain = true;
        this.successMessage = 'Zdjęcie główne zostało zmienione';
        // setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = 'Nie udało się zmienić zdjęcia głównego';
        console.error('Błąd podczas zmiany zdjęcia głównego:', error);
      }
    });
  }

  setNewImageAsMain(index: number): void {
    this.selectedNewImages.forEach(img => img.isMain = false);
    this.selectedNewImages[index].isMain = true;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  private uploadNewImages(): void {
    if (this.selectedNewImages.length === 0) {
      this.onToolUpdated();
      return;
    }

    // Sprawdź czy któreś z nowych zdjęć ma być główne
    const hasMainImage = this.selectedNewImages.some(img => img.isMain);
    const hasExistingMainImage = this.existingImages.some(img => img.isMain);

    // Jeśli żadne nowe zdjęcie nie jest główne i nie ma istniejącego głównego
    if (!hasMainImage && !hasExistingMainImage && this.selectedNewImages.length > 0) {
      this.selectedNewImages[0].isMain = true;
    }

    // Wysyłaj zdjęcia sekwencyjnie
    this.uploadImageSequentially(0);
  }

  private uploadImageSequentially(index: number): void {
    if (index >= this.selectedNewImages.length) {
      this.onToolUpdated();
      return;
    }

    const imagePreview = this.selectedNewImages[index];
    const formData = new FormData();
    formData.append('file', imagePreview.file);
    formData.append('isMain', imagePreview.isMain.toString());

    this.toolService.uploadToolImage(this.toolId, formData).subscribe({
      next: (response) => {
        // Przejdź do następnego zdjęcia
        this.uploadImageSequentially(index + 1);
      },
      error: (error) => {
        console.error(`Error uploading image ${index + 1}:`, error);
        // Mimo błędu, przejdź do następnego zdjęcia
        this.uploadImageSequentially(index + 1);
      }
    });
  }

  // ========== POZOSTAŁE METODY (bez zmian) ==========

  private updateMapWithToolLocation(): void {
    if (this.currentTool && this.map && this.marker) {
      const location = {
        lat: this.currentTool.latitude,
        lng: this.currentTool.longitude
      };
      this.map.setCenter(location);
      this.marker.setPosition(location);
    }
  }

  private loadGoogleMapsScript(): void {
    // Definiujemy globalną funkcję callback
    (window as any).initMap = () => {
      this.initMap();
    };

    // Sprawdź, czy Google Maps jest już załadowane
    if ((window as any).google && (window as any).google.maps) {
      this.initMap();
      return;
    }

    // Dodaj skrypt Google Maps do strony
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places&callback=initMap`;
    script.defer = true;
    script.async = true;

    // Dodajemy obsługę błędów ładowania
    script.onerror = () => {
      console.error('Nie udało się załadować Google Maps API');
      this.errorMessage = 'Nie udało się załadować mapy. Spróbuj odświeżyć stronę.';
    };

    this.renderer.appendChild(document.body, script);
  }

  private initMap(): void {
    // Upewnij się, że element DOM dla mapy istnieje
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    try {
      // Użyj lokalizacji z narzędzia lub domyślnej (Kraków)
      const defaultLocation = this.currentTool ? {
        lat: this.currentTool.latitude,
        lng: this.currentTool.longitude
      } : {
        lat: 50.0647,
        lng: 19.9450
      };

      // Utwórz mapę
      this.map = new (window as any).google.maps.Map(this.mapContainer.nativeElement, {
        center: defaultLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true
      });

      // Utwórz geocoder
      this.geocoder = new (window as any).google.maps.Geocoder();

      // Dodaj znacznik
      this.marker = new (window as any).google.maps.Marker({
        position: defaultLocation,
        map: this.map,
        draggable: true,
        animation: (window as any).google.maps.Animation.DROP
      });

      // Dodaj listener kliknięcia na mapę
      this.map.addListener('click', (event: any) => {
        if (event.latLng) {
          this.updateMarkerPosition(event.latLng);
        }
      });

      // Dodaj listener przeciągnięcia znacznika
      this.marker.addListener('dragend', () => {
        if (this.marker && this.marker.getPosition()) {
          const position = this.marker.getPosition();
          if (position) {
            this.updateMarkerPosition(position);
          }
        }
      });

      // Inicjalizacja autouzupełniania dla pola adresu
      this.initAutocomplete();

      // Jeśli mamy już dane narzędzia, zaktualizuj mapę
      if (this.currentTool) {
        this.updateMapWithToolLocation();
      }
    } catch (error) {
      console.error('Błąd podczas inicjalizacji mapy:', error);
      this.errorMessage = 'Nie udało się załadować mapy. Spróbuj odświeżyć stronę.';
    }
  }

  // Inicjalizacja autouzupełniania adresu
  private initAutocomplete(): void {
    // Upewnij się, że element DOM dla pola adresu istnieje
    if (!this.addressInput || !this.addressInput.nativeElement) {
      setTimeout(() => this.initAutocomplete(), 100);
      return;
    }

    try {
      // Inicjalizacja autouzupełniania Google dla pola adresu
      this.autocomplete = new (window as any).google.maps.places.Autocomplete(
        this.addressInput.nativeElement,
        { types: ['address'] }
      );

      // Preferowanie wyników z Polski (opcjonalne)
      this.autocomplete.setComponentRestrictions({ country: 'pl' });

      // Nasłuchiwanie na wybór adresu z listy podpowiedzi
      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();

        if (!place.geometry) {
          console.warn("Wybrane miejsce nie ma geometrii");
          return;
        }

        // Aktualizacja mapy i znacznika
        if (place.geometry.location) {
          this.map.setCenter(place.geometry.location);
          this.map.setZoom(16);
          this.updateMarkerPosition(place.geometry.location);
        }
      });
    } catch (error) {
      console.error('Błąd podczas inicjalizacji autouzupełniania:', error);
    }
  }

  // Geocodowanie adresu wpisanego przez użytkownika
  geocodeAddress(address: string): void {
    if (!this.geocoder || this.isAddressFromMarker) return;

    this.isLoadingLocation = true;

    this.geocoder.geocode(
      { address: address },
      (results: any[], status: string) => {
        this.isLoadingLocation = false;

        if (status === 'OK' && results && results[0] && results[0].geometry) {
          const location = results[0].geometry.location;

          // Aktualizacja mapy i znacznika
          if (location) {
            this.map.setCenter(location);
            this.map.setZoom(16);

            // Aktualizujemy pozycję znacznika bez ustawiania adresu (aby uniknąć zapętlenia)
            this.marker.setPosition(location);
            this.updateLocationInForm(location.lat(), location.lng());
          }
        } else {
          console.warn('Nie udało się znaleźć lokalizacji dla tego adresu:', status);
        }
      }
    );
  }

  tryGetCurrentLocation(): void {
    this.isLoadingLocation = true;

    if (!navigator.geolocation) {
      this.errorMessage = 'Geolokalizacja nie jest wspierana przez tę przeglądarkę.';
      this.isLoadingLocation = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Sukces: otrzymano pozycję
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Ustaw znacznik i wycentruj mapę
        if (this.map && this.marker) {
          this.map.setCenter(location);

          // Tworzymy nowy obiekt LatLng
          const latLng = new (window as any).google.maps.LatLng(location.lat, location.lng);
          this.updateMarkerPosition(latLng);
        }

        this.isLoadingLocation = false;
      },
      (error) => {
        // Obsługa błędów geolokalizacji
        let errorMsg = 'Błąd podczas pobierania lokalizacji.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Dostęp do geolokalizacji został odrzucony przez użytkownika.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Dane lokalizacyjne są niedostępne.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Upłynął limit czasu żądania lokalizacji.';
            break;
        }
        console.error(errorMsg, error);
        this.isLoadingLocation = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  updateMarkerPosition(position: GoogleLatLng): void {
    if (this.marker) {
      this.marker.setPosition(position);

      // Zaktualizuj formularz
      this.updateLocationInForm(position.lat(), position.lng());

      // Wykonaj geokodowanie odwrotne, aby uzyskać adres
      this.reverseGeocode(position.lat(), position.lng());
    }
  }

  updateLocationInForm(lat: number, lng: number): void {
    this.toolForm.patchValue({
      latitude: lat,
      longitude: lng
    });
  }

  reverseGeocode(lat: number, lng: number): void {
    if (!this.geocoder) return;

    this.isAddressFromMarker = true; // Ustawienie flagi, aby zapobiec zapętleniu

    this.geocoder.geocode(
      { location: { lat, lng } },
      (results: GoogleGeocodeResult[], status: string) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address;

          this.toolForm.patchValue({ address });

          // Resetujemy flagę po krótkim opóźnieniu, aby zdążyć obsłużyć zmianę w formularzu
          setTimeout(() => {
            this.isAddressFromMarker = false;
          }, 1500);
        } else {
          console.warn('Nie udało się określić adresu dla tej lokalizacji:', status);
          this.isAddressFromMarker = false;
        }
      }
    );
  }

  onSubmit(): void {
    if (this.toolForm.invalid) {
      this.markFormGroupTouched(this.toolForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = this.toolForm.value;

    // Upewnij się, że latitude i longitude nie są null
    if (!formData.latitude || !formData.longitude) {
      this.errorMessage = 'Lokalizacja jest wymagana. Wybierz punkt na mapie.';
      this.isSubmitting = false;
      return;
    }

    this.toolService.updateTool(this.toolId, formData).subscribe({
      next: (response) => {
        // Po zaktualizowaniu danych narzędzia, prześlij nowe zdjęcia
        this.uploadNewImages();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Wystąpił błąd podczas aktualizacji narzędzia. Spróbuj ponownie.';
        console.error('Błąd podczas aktualizacji narzędzia:', error);
      }
    });
  }

  private onToolUpdated(): void {
    this.isSubmitting = false;
    this.successMessage = 'Narzędzie zostało pomyślnie zaktualizowane!';

    // Przekieruj do listy narzędzi użytkownika
    setTimeout(() => {
      this.router.navigate(['/my-tools']);
    }, 1000);
  }

  onToggleStatus(): void {
    const action = this.currentTool?.isActive ? 'dezaktywować' : 'aktywować';
    const actionUpper = this.currentTool?.isActive ? 'Dezaktywować' : 'Aktywować';

    const confirmMessage = this.currentTool?.isActive
      ? 'Czy na pewno chcesz dezaktywować to narzędzie? Zostanie ono ukryte w wynikach wyszukiwania, ale istniejące rezerwacje pozostaną aktywne.'
      : 'Czy na pewno chcesz aktywować to narzędzie? Stanie się ono ponownie widoczne w wynikach wyszukiwania.';

    if (confirm(confirmMessage)) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const operation = this.currentTool?.isActive
        ? this.toolService.deactivateTool(this.toolId)
        : this.toolService.activateTool(this.toolId);

      operation.subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.successMessage = `Narzędzie zostało pomyślnie ${this.currentTool?.isActive ? 'dezaktywowane' : 'aktywowane'}!`;

          // Zaktualizuj dane narzędzia
          this.currentTool = response;

          // Opcjonalnie: przekieruj do listy narzędzi po pewnym czasie
          setTimeout(() => {
            this.router.navigate(['/my-tools']);
          }, 1000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || `Wystąpił błąd podczas ${action}owania narzędzia. Spróbuj ponownie.`;
          console.error(`Błąd podczas ${action}owania narzędzia:`, error);
        }
      });
    }
  }

  // Pomocnicza metoda do oznaczania wszystkich pól jako dotknięte (dla walidacji)
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Pomocnicze gettery dla uproszczenia dostępu w szablonie
  get nameControl() { return this.toolForm.get('name'); }
  get descriptionControl() { return this.toolForm.get('description'); }
  get categoryControl() { return this.toolForm.get('category'); }
  get pricePerDayControl() { return this.toolForm.get('pricePerDay'); }
  get addressControl() { return this.toolForm.get('address'); }

  // Metoda do formatowania nazw kategorii
  formatCategoryName(category: string): string {
    return category
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
