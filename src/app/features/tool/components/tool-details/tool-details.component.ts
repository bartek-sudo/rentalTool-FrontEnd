import { Component, inject, OnInit } from '@angular/core';
import { ToolAvailabilityComponent } from "../tool-availability/tool-availability.component";
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Tool } from '../../models/tool.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ToolService } from '../../services/tool.service';
import { environment } from '../../../../../environments/enviroment';
import { ToolImage } from '../../models/tool-image.model';

@Component({
  selector: 'app-tool-details',
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ToolAvailabilityComponent
  ],
  templateUrl: './tool-details.component.html',
  styleUrl: './tool-details.component.css'
})
export class ToolDetailsComponent implements OnInit{
  private toolService = inject(ToolService);
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
        this.isLoading = false;
      },
      (error) => {
        this.errorMessage = 'Error loading tool details. Please try again later.';
        this.isLoading = false;
        this.router.navigate(['/tools']);
      }
    );
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

  // Metoda do przełączania zdjęć w galerii
  changeImage(index: number): void {
    if (index >= 0 && index < this.toolImages.length) {
      this.currentImageIndex = index;
    }
  }

  // Metoda do przechodzenia do następnego zdjęcia
  nextImage(): void {
    if (this.currentImageIndex < this.toolImages.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0; // Zapętlenie do pierwszego zdjęcia
    }
  }

  // Metoda do przechodzenia do poprzedniego zdjęcia
  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.toolImages.length - 1; // Zapętlenie do ostatniego zdjęcia
    }
  }

}
