import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyAvailability } from '../../models/daily-availability.model';
import { ToolService } from '../../services/tool.service';
import { ReservationService } from '../../../reservation/services/reservation.service';

@Component({
  selector: 'app-tool-availability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tool-availability.component.html',
  styleUrls: ['./tool-availability.component.css']
})
export class ToolAvailabilityComponent implements OnInit {
  @Input() toolId: number = 1;
  @Input() pricePerDay: number = 0;

  currentMonth: Date = new Date();
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  availabilityData: DailyAvailability[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  weekdays: string[] = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

  calendarDays: any[] = [];

  constructor(
    private toolService: ToolService,
    private reservationService: ReservationService
  ) { }

  ngOnInit(): void {
    this.loadAvailabilityData();
  }

  private dateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadAvailabilityData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const today = new Date();

    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

    const startDateStr = this.dateToString(startDate);
    const endDateStr = this.dateToString(endDate);

    this.toolService.getToolAvailability(this.toolId, startDateStr, endDateStr)
      .subscribe({
        next: (data) => {
          this.availabilityData = data.map((item: any) => ({
            date: item.date,
            available: item.available !== undefined ? item.available : item.isAvailable
          }));

          this.generateCalendar();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Błąd podczas pobierania dostępności:', error);
          this.errorMessage = 'Nie udało się załadować dostępności narzędzia.';
          this.isLoading = false;
        }
      });
  }

  generateExampleData(): void {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);

    this.availabilityData = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const available = Math.random() > 0.2;
      this.availabilityData.push({
        date: new Date(currentDate).toISOString().split('T')[0],
        available: available
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    this.generateCalendar();
  }

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const daysInMonth = this.getDaysInMonth(this.currentMonth);
    const firstDayOfMonth = this.getFirstDayOfMonth(this.currentMonth);

    this.calendarDays = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      this.calendarDays.push({
        day: null,
        isCurrentMonth: false
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      this.calendarDays.push({
        day: day,
        date: date,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        isAvailable: this.isDayAvailable(year, month, day),
        isSelected: this.isDaySelected(year, month, day)
      });
    }
  }

  getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  getFirstDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isDayAvailable(year: number, month: number, day: number): boolean {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = this.availabilityData.find(d => d.date === dateStr);

    if (!dayData) return false;

    return dayData.available;
  }

  isDaySelected(year: number, month: number, day: number): boolean {
    if (!this.selectedStartDate && !this.selectedEndDate) return false;

    const date = new Date(year, month, day);

    if (this.selectedStartDate && !this.selectedEndDate) {
      return date.toDateString() === this.selectedStartDate.toDateString();
    }

    if (this.selectedStartDate && this.selectedEndDate) {
      return date >= this.selectedStartDate && date <= this.selectedEndDate;
    }

    return false;
  }

  handleDayClick(day: any): void {
    if (!day.day || !day.isCurrentMonth || !day.isAvailable) return;

    const clickedDate = day.date;

    if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
      this.selectedStartDate = clickedDate;
      this.selectedEndDate = null;
    } else {
      if (clickedDate < this.selectedStartDate) {
        this.selectedStartDate = clickedDate;
        this.selectedEndDate = null;
      } else {
        let allDaysAvailable = true;
        let currentDay = new Date(this.selectedStartDate);

        while (currentDay <= clickedDate) {
          if (!this.isDayAvailable(
            currentDay.getFullYear(),
            currentDay.getMonth(),
            currentDay.getDate()
          )) {
            allDaysAvailable = false;
            break;
          }
          currentDay.setDate(currentDay.getDate() + 1);
        }

        if (!allDaysAvailable) {
          alert('Wybrany zakres zawiera niedostępne dni!');
          return;
        }

        this.selectedEndDate = clickedDate;
      }
    }

    this.generateCalendar();
  }

  prevMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.checkIfNeedToLoadData();
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.checkIfNeedToLoadData();
    this.generateCalendar();
  }

  checkIfNeedToLoadData(): void {
    const currentMonthStr = this.currentMonth.toISOString().split('T')[0].substring(0, 7);
    const hasDataForMonth = this.availabilityData.some(day =>
      day.date.startsWith(currentMonthStr)
    );

    if (!hasDataForMonth && !this.isLoading) {
      this.loadAvailabilityData();
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return 'Nie wybrano';

    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatMonthHeader(): string {
    return this.currentMonth.toLocaleDateString('pl-PL', {
      month: 'long',
      year: 'numeric'
    });
  }

  resetSelection(): void {
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.generateCalendar();
  }

  confirmReservation(): void {
    if (!this.selectedStartDate || !this.selectedEndDate) {
      alert('Wybierz datę rozpoczęcia i zakończenia!');
      return;
    }

    this.isLoading = true;
    const reservationData = {
      startDate: this.dateToString(this.selectedStartDate),
      endDate: this.dateToString(this.selectedEndDate),
      toolId: this.toolId,
      termsId: 1
    };

    this.reservationService.createReservation(reservationData)
      .subscribe({
        next: () => {
          alert(`Rezerwacja utworzona od ${this.formatDate(this.selectedStartDate)} do ${this.formatDate(this.selectedEndDate)}`);
          this.resetSelection();
          this.loadAvailabilityData();
        },
        error: (error) => {
          console.error('Błąd podczas tworzenia rezerwacji:', error);

          if (error.error?.message === 'You cannot reserve your own tool') {
            this.errorMessage = 'Nie możesz zarezerwować swojego własnego narzędzia.';
          } else {
            this.errorMessage = 'Nie udało się utworzyć rezerwacji. Spróbuj ponownie.';
          }

          this.isLoading = false;
        }
      });
  }


  getNumberOfDays(): number {
    if (!this.selectedStartDate || !this.selectedEndDate) return 0;

    const timeDiff = this.selectedEndDate.getTime() - this.selectedStartDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff + 1;
  }

  getTotalPrice(): number {
    return this.getNumberOfDays() * this.pricePerDay;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    });
  }
}
