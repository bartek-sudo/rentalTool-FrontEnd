import { Component, inject, OnInit } from '@angular/core';
import { ToolAvailabilityComponent } from "../tool-availability/tool-availability.component";
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Tool } from '../../models/tool.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ToolService } from '../../services/tool.service';
import { UserService } from '../../../user/services/user.service';
import { environment } from '../../../../../environments/enviroment';
import { ToolImage } from '../../models/tool-image.model';

@Component({
  selector: 'app-tool-details',
  imports: [
    CommonModule,
    CurrencyPipe,
    ToolAvailabilityComponent
  ],
  templateUrl: './tool-details.component.html',
  styleUrl: './tool-details.component.css'
})
export class ToolDetailsComponent implements OnInit{
  private toolService = inject(ToolService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  toolId: number;
  tool: Tool | null = null;
  toolImages: ToolImage[] = [];
  currentImageIndex = 0;

  isLoading = true;
  errorMessage = '';

  googleMapsApiKey = environment.googleMapsApiKey;

  constructor() {
    this.toolId = 0;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.toolId = +params['id'];
      this.loadToolDetails();
      this.loadToolImages();
    });
  }

  loadToolDetails(): void {
    this.isLoading = true;
    this.toolService.getToolById(this.toolId).subscribe(
      (tool) => {
        this.tool = tool;
        if (tool.ownerId) {
          this.loadOwnerDetails(tool.ownerId);
        }
        this.isLoading = false;
      },
      (error) => {
        this.errorMessage = 'Error loading tool details. Please try again later.';
        this.isLoading = false;
        this.router.navigate(['/tools']);
      }
    );
  }

  loadOwnerDetails(ownerId: number): void {
    this.userService.getUserById(ownerId).subscribe({
      next: (response) => {
        if (response.data?.user && this.tool) {
          this.tool.owner = response.data.user;
        }
      },
      error: (error) => {
        console.error('Error loading owner details:', error);
      }
    });
  }

  loadToolImages(): void {
    this.toolService.getToolImages(this.toolId).subscribe(
      (response) => {
        this.toolImages = response.data.images;
      },
      (error) => {
        console.error('Error loading tool images:', error);
      }
    );
  }

  changeImage(index: number): void {
    if (index >= 0 && index < this.toolImages.length) {
      this.currentImageIndex = index;
    }
  }

  nextImage(): void {
    if (this.currentImageIndex < this.toolImages.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.toolImages.length - 1;
    }
  }

  getInitials(firstName?: string | null, lastName?: string | null): string {
    if (!firstName || !lastName) return '?';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'Brak daty';
    }

    try {
      const parts = dateString.split(' ');
      if (parts.length === 2) {
        const datePart = parts[0];
        const timePart = parts[1];
        const dateParts = datePart.split('-');
        if (dateParts.length === 3) {
          const day = dateParts[0];
          const month = dateParts[1];
          const year = dateParts[2];

          const isoDate = `${year}-${month}-${day}T${timePart}`;
          const date = new Date(isoDate);

          if (isNaN(date.getTime())) {
            return 'Nieprawidłowa data';
          }

          return date.toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Nieprawidłowa data';
      }

      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Błąd formatowania daty:', error, 'dla daty:', dateString);
      return 'Błąd daty';
    }
  }

}
