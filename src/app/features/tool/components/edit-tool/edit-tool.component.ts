import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToolService } from '../../services/tool.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/enviroment';
import { CategoryName } from '../../models/category.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TermsService } from '../../../reservation/services/terms.service';
import { TermsDto } from '../../../reservation/model/terms.model';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';

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

interface ImagePreview {
  file: File;
  url: string;
  isMain: boolean;
}

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

  categories = Object.values(CategoryName);

  terms: TermsDto[] = [];
  filteredTerms: TermsDto[] = [];
  selectedTermDetails: TermsDto | null = null;
  termsLoading: boolean = false;
  termsError: string = '';
  availableCategories: Category[] = [];

  existingImages: ToolImage[] = [];
  selectedNewImages: ImagePreview[] = [];
  maxImages: number = 10;
  maxFileSize: number = 5 * 1024 * 1024; // 5MB
  allowedFileTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];
  isDragOver: boolean = false;

  private googleMapsApiKey = environment.googleMapsApiKey;
  private map: any = null;
  private marker: any = null;
  private geocoder: any = null;
  private autocomplete: any = null;

  constructor(
    private fb: FormBuilder,
    private toolService: ToolService,
    private termsService: TermsService,
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private categoryService: CategoryService
  ) {
    this.toolForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      category: ['', Validators.required],
      pricePerDay: [null, [Validators.required, Validators.min(1)]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      isActive: [true],
      termsId: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.toolId = +params['id'];
      if (this.toolId) {
        this.loadToolData();
        this.loadToolImages();
      } else {
        this.errorMessage = 'Nieprawidłowy identyfikator narzędzia';
      }
    });

    this.loadTerms();
    this.loadCategories();

    this.toolForm.get('category')?.valueChanges.subscribe(category => {
      this.updateFilteredTerms(category);
    });

    this.toolForm.get('termsId')?.valueChanges.subscribe(termId => {
      this.updateSelectedTermDetails(termId);
    });

    this.loadGoogleMapsScript();

    this.toolForm.get('address')?.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      )
      .subscribe(address => {
        if (address && address.length > 5 && !this.isAddressFromMarker) {
          this.geocodeAddress(address);
        }
      });
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        this.availableCategories = response.data?.categories || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  private isAddressFromMarker = false;

  ngAfterViewInit(): void {
  }

  private loadTerms(): void {
    this.termsLoading = true;
    this.termsService.getAllTerms().subscribe({
      next: (response) => {
        this.terms = response.data?.terms || [];
        this.updateFilteredTerms(this.toolForm.get('category')?.value || null);
        const currentTermId = this.toolForm.get('termsId')?.value;
        if (currentTermId) {
          this.updateSelectedTermDetails(currentTermId);
        }
        this.termsLoading = false;
      },
      error: (error) => {
        console.error('Błąd podczas ładowania regulaminów:', error);
        this.termsError = 'Nie udało się pobrać listy regulaminów.';
        this.termsLoading = false;
      }
    });
  }

  private updateFilteredTerms(category: string | null): void {
    if (!this.terms.length) {
      this.filteredTerms = [];
      return;
    }

    const generalTerms = this.terms.filter(term => !term.categoryName);
    const categoryTerms = category
      ? this.terms.filter(term => term.categoryName === category)
      : [];

    this.filteredTerms = [...categoryTerms, ...generalTerms];

    const currentTermId = this.toolForm.get('termsId')?.value;
    if (currentTermId && !this.filteredTerms.some(term => term.id === currentTermId)) {
      this.toolForm.patchValue({ termsId: 1 });
      this.selectedTermDetails = this.terms.find(term => term.id === 1) || null;
    } else if (currentTermId) {
      this.updateSelectedTermDetails(currentTermId);
    }
  }

  private updateSelectedTermDetails(termId: number | null): void {
    if (!termId) {
      this.selectedTermDetails = null;
      return;
    }
    this.selectedTermDetails = this.terms.find(term => term.id === termId) || null;
  }

  getTermCategoryLabel(category: string | null): string {
    if (!category) {
      return 'Regulamin ogólny';
    }
    const categoryObj = this.availableCategories.find(c => c.name === category);
    return categoryObj ? `Kategoria: ${categoryObj.displayName}` : `Kategoria: ${this.formatCategoryName(category)}`;
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
        isActive: this.currentTool.isActive,
        termsId: this.currentTool.termsId ?? 1
      });

      if (this.map && this.marker) {
        this.updateMapWithToolLocation();
      }
    }
  }

  //  METODY DO OBSŁUGI ZDJĘĆ

  onFileSelect(event: any): void {
    const files = event.target.files;
    this.handleFiles(files);
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

      if (this.selectedNewImages.some(img =>
          img.file.name === file.name &&
          img.file.size === file.size &&
          img.file.lastModified === file.lastModified)) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imagePreview: ImagePreview = {
          file: file,
          url: e.target?.result as string,
          isMain: false
        };
        this.selectedNewImages.push(imagePreview);
        this.errorMessage = '';
      };
      reader.readAsDataURL(file);
    }
  }

  private validateFile(file: File): boolean {
    if (!this.allowedFileTypes.includes(file.type)) {
      this.errorMessage = 'Dozwolone są tylko pliki JPG, PNG i WebP.';
      return false;
    }

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
        this.existingImages.forEach(img => img.isMain = false);
        image.isMain = true;
        this.successMessage = 'Zdjęcie główne zostało zmienione';
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

    const hasMainImage = this.selectedNewImages.some(img => img.isMain);
    const hasExistingMainImage = this.existingImages.some(img => img.isMain);

    if (!hasMainImage && !hasExistingMainImage && this.selectedNewImages.length > 0) {
      this.selectedNewImages[0].isMain = true;
    }

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
        this.uploadImageSequentially(index + 1);
      },
      error: (error) => {
        console.error(`Error uploading image ${index + 1}:`, error);
        this.uploadImageSequentially(index + 1);
      }
    });
  }


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
    (window as any).initMap = () => {
      this.initMap();
    };

    if ((window as any).google && (window as any).google.maps) {
      this.initMap();
      return;
    }

    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places&callback=initMap`;
    script.defer = true;
    script.async = true;

    script.onerror = () => {
      console.error('Nie udało się załadować Google Maps API');
      this.errorMessage = 'Nie udało się załadować mapy. Spróbuj odświeżyć stronę.';
    };

    this.renderer.appendChild(document.body, script);
  }

  private initMap(): void {
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    try {
      const defaultLocation = this.currentTool ? {
        lat: this.currentTool.latitude,
        lng: this.currentTool.longitude
      } : {
        lat: 50.0647,
        lng: 19.9450
      };

      this.map = new (window as any).google.maps.Map(this.mapContainer.nativeElement, {
        center: defaultLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true
      });

      this.geocoder = new (window as any).google.maps.Geocoder();

      this.marker = new (window as any).google.maps.Marker({
        position: defaultLocation,
        map: this.map,
        draggable: true,
        animation: (window as any).google.maps.Animation.DROP
      });

      this.map.addListener('click', (event: any) => {
        if (event.latLng) {
          this.updateMarkerPosition(event.latLng);
        }
      });

      this.marker.addListener('dragend', () => {
        if (this.marker && this.marker.getPosition()) {
          const position = this.marker.getPosition();
          if (position) {
            this.updateMarkerPosition(position);
          }
        }
      });

      this.initAutocomplete();

      if (this.currentTool) {
        this.updateMapWithToolLocation();
      }
    } catch (error) {
      console.error('Błąd podczas inicjalizacji mapy:', error);
      this.errorMessage = 'Nie udało się załadować mapy. Spróbuj odświeżyć stronę.';
    }
  }

  private initAutocomplete(): void {
    if (!this.addressInput || !this.addressInput.nativeElement) {
      setTimeout(() => this.initAutocomplete(), 100);
      return;
    }

    try {
      this.autocomplete = new (window as any).google.maps.places.Autocomplete(
        this.addressInput.nativeElement,
        { types: ['address'] }
      );

      this.autocomplete.setComponentRestrictions({ country: 'pl' });

      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();

        if (!place.geometry) {
          console.warn("Wybrane miejsce nie ma geometrii");
          return;
        }

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

  geocodeAddress(address: string): void {
    if (!this.geocoder || this.isAddressFromMarker) return;

    this.isLoadingLocation = true;

    this.geocoder.geocode(
      { address: address },
      (results: any[], status: string) => {
        this.isLoadingLocation = false;

        if (status === 'OK' && results && results[0] && results[0].geometry) {
          const location = results[0].geometry.location;

          if (location) {
            this.map.setCenter(location);
            this.map.setZoom(16);

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
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (this.map && this.marker) {
          this.map.setCenter(location);

          const latLng = new (window as any).google.maps.LatLng(location.lat, location.lng);
          this.updateMarkerPosition(latLng);
        }

        this.isLoadingLocation = false;
      },
      (error) => {
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

      this.updateLocationInForm(position.lat(), position.lng());

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

    this.isAddressFromMarker = true;

    this.geocoder.geocode(
      { location: { lat, lng } },
      (results: GoogleGeocodeResult[], status: string) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address;

          this.toolForm.patchValue({ address });

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

    if (!formData.latitude || !formData.longitude) {
      this.errorMessage = 'Lokalizacja jest wymagana. Wybierz punkt na mapie.';
      this.isSubmitting = false;
      return;
    }

    if (this.existingImages.length === 0 && this.selectedNewImages.length === 0) {
      this.errorMessage = 'Narzędzie musi mieć co najmniej jedno zdjęcie przed przesłaniem do moderacji.';
      this.isSubmitting = false;
      return;
    }

    this.toolService.updateTool(this.toolId, formData).subscribe({
      next: (response) => {
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

      const newActiveStatus = !this.currentTool?.isActive;
      const operation = this.toolService.setToolStatus(this.toolId, newActiveStatus);

      operation.subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.successMessage = `Narzędzie zostało pomyślnie ${newActiveStatus ? 'aktywowane' : 'dezaktywowane'}!`;

          this.currentTool = response.data.Tool;

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

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get nameControl() { return this.toolForm.get('name'); }
  get descriptionControl() { return this.toolForm.get('description'); }
  get categoryControl() { return this.toolForm.get('category'); }
  get pricePerDayControl() { return this.toolForm.get('pricePerDay'); }
  get addressControl() { return this.toolForm.get('address'); }
  get termsControl() { return this.toolForm.get('termsId'); }

  formatCategoryName(category: string): string {
    const categoryObj = this.availableCategories.find(c => c.name === category);
    if (categoryObj) {
      return categoryObj.displayName;
    }
    const categoryLabels: { [key: string]: string } = {
      'GARDENING': 'Ogród',
      'CONSTRUCTION': 'Budowa',
      'ELECTRIC': 'Elektryka',
      'PLUMBING': 'Hydraulika',
      'AUTOMOTIVE': 'Motoryzacja',
      'PAINTING': 'Malowanie',
      'CLEANING': 'Sprzątanie',
      'WOODWORKING': 'Stolarstwo',
      'METALWORKING': 'Obróbka metalu',
      'OUTDOOR': 'Sprzęt na zewnątrz',
      'OTHER': 'Inne'
    };
    return categoryLabels[category] || category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }
}
