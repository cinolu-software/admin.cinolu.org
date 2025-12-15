import { Component, input, forwardRef, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule, Calendar, ChevronLeft, ChevronRight } from 'lucide-angular';

export type DatePickerView = 'date' | 'month' | 'year';

@Component({
  selector: 'ui-datepicker',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './datepicker.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiDatepicker), multi: true }]
})
export class UiDatepicker implements ControlValueAccessor {
  view = input<DatePickerView>('date');
  label = input<string>('');
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  id = input<string>('');
  invalid = input<boolean>(false);
  dateFormat = input<string>('');
  minDate = input<Date | null>(null);
  maxDate = input<Date | null>(null);
  isOpen = signal<boolean>(false);
  selectedDate = signal<Date | null>(null);
  currentViewDate = signal<Date>(new Date());
  icons = { Calendar, ChevronLeft, ChevronRight };

  #onChangeCallback!: (value: Date | null) => void;
  #onTouchedCallback!: () => void;

  writeValue(value: Date | null): void {
    this.selectedDate.set(value);
    if (value) {
      this.currentViewDate.set(new Date(value));
    }
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.#onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    void isDisabled;
  }

  years = computed(() => {
    const current = this.currentViewDate();
    const year = current.getFullYear();
    const startYear = Math.floor(year / 10) * 10;
    const years: number[] = [];
    for (let i = startYear - 1; i <= startYear + 10; i++) {
      years.push(i);
    }
    return years;
  });

  months = computed(() => {
    const months: { name: string; value: number }[] = [];
    const date = new Date(2000, 0, 1);
    for (let i = 0; i < 12; i++) {
      date.setMonth(i);
      months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        value: i
      });
    }
    return months;
  });

  calendarDays = computed(() => {
    const date = this.currentViewDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  });

  monthYearLabel = computed(() => {
    const date = this.currentViewDate();
    if (this.view() === 'year') {
      const year = date.getFullYear();
      const startYear = Math.floor(year / 10) * 10;
      return `${startYear} - ${startYear + 9}`;
    }
    if (this.view() === 'month') {
      return date.getFullYear().toString();
    }
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  formattedValue = computed(() => {
    const date = this.selectedDate();
    if (!date) return '';
    if (this.dateFormat()) {
      return this.formatDate(date, this.dateFormat());
    }
    if (this.view() === 'year') {
      return date.getFullYear().toString();
    }
    if (this.view() === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  });

  toggleCalendar(): void {
    if (this.disabled()) return;
    this.isOpen.update((open) => !open);
  }

  closeCalendar(): void {
    this.isOpen.set(false);
    this.#onTouchedCallback();
  }

  selectYear(year: number): void {
    const newDate = new Date(this.currentViewDate());
    newDate.setFullYear(year);
    this.currentViewDate.set(newDate);
    this.selectedDate.set(newDate);
    this.#onChangeCallback(newDate);
    this.closeCalendar();
  }

  selectMonth(month: number): void {
    const newDate = new Date(this.currentViewDate());
    newDate.setMonth(month);
    this.currentViewDate.set(newDate);

    if (this.view() === 'month') {
      this.selectedDate.set(newDate);
      this.#onChangeCallback(newDate);
      this.closeCalendar();
    } else {
      // Switch to date view
      this.currentViewDate.set(newDate);
    }
  }

  selectDay(day: number): void {
    const newDate = new Date(this.currentViewDate());
    newDate.setDate(day);
    this.selectedDate.set(newDate);
    this.#onChangeCallback(newDate);
    this.closeCalendar();
  }

  navigatePrevious(): void {
    const date = new Date(this.currentViewDate());
    if (this.view() === 'year') {
      date.setFullYear(date.getFullYear() - 10);
    } else if (this.view() === 'month') {
      date.setFullYear(date.getFullYear() - 1);
    } else {
      date.setMonth(date.getMonth() - 1);
    }
    this.currentViewDate.set(date);
  }

  navigateNext(): void {
    const date = new Date(this.currentViewDate());
    if (this.view() === 'year') {
      date.setFullYear(date.getFullYear() + 10);
    } else if (this.view() === 'month') {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    this.currentViewDate.set(date);
  }

  isSelectedYear(year: number): boolean {
    const selected = this.selectedDate();
    return selected?.getFullYear() === year;
  }

  isSelectedMonth(month: number): boolean {
    const selected = this.selectedDate();
    const current = this.currentViewDate();
    return selected?.getFullYear() === current.getFullYear() && selected?.getMonth() === month;
  }

  isSelectedDay(day: number): boolean {
    const selected = this.selectedDate();
    const current = this.currentViewDate();
    return (
      selected?.getFullYear() === current.getFullYear() &&
      selected?.getMonth() === current.getMonth() &&
      selected?.getDate() === day
    );
  }

  isToday(day: number): boolean {
    const today = new Date();
    const current = this.currentViewDate();
    return (
      today.getFullYear() === current.getFullYear() &&
      today.getMonth() === current.getMonth() &&
      today.getDate() === day
    );
  }

  isDisabledYear(year: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && year < min.getFullYear()) return true;
    if (max && year > max.getFullYear()) return true;
    return false;
  }

  isDisabledMonth(month: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const current = this.currentViewDate();
    const testDate = new Date(current.getFullYear(), month, 1);
    if (min && testDate < min) return true;
    if (max && testDate > max) return true;
    return false;
  }

  isDisabledDay(day: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const current = this.currentViewDate();
    const testDate = new Date(current.getFullYear(), current.getMonth(), day);
    if (min && testDate < min) return true;
    if (max && testDate > max) return true;
    return false;
  }

  formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return format
      .replace('yy', year.toString().slice(-2))
      .replace('yyyy', year.toString())
      .replace('mm', month.toString().padStart(2, '0'))
      .replace('dd', day.toString().padStart(2, '0'));
  }

  inputClasses() {
    const baseClasses = 'ui-datepicker';
    const invalidClass = this.invalid() ? 'ui-datepicker-invalid' : '';
    const disabledClass = this.disabled() ? 'ui-datepicker-disabled' : '';
    return [baseClasses, invalidClass, disabledClass].filter(Boolean).join(' ');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const element = target.closest('.ui-datepicker-wrapper');
    if (!element && this.isOpen()) {
      this.closeCalendar();
    }
  }
}
