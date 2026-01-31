import { AbstractControl } from '@angular/forms';
import { ICategory } from '@shared/models';

export function parseDate(dateString: string | undefined): Date {
  return dateString ? new Date(dateString) : new Date();
}

export function extractCategoryIds(categories?: ICategory[]): string[] {
  return categories?.map((c) => c.id) ?? [];
}

export function extractYear(date: string | Date): number {
  return new Date(date).getFullYear();
}

export function extractIds<T extends { id: string }>(items?: T[]): string[] {
  return items?.map((item) => item.id) ?? [];
}

export function markAllAsTouched(control: AbstractControl): void {
  control.markAsTouched();
  if ('controls' in control) {
    const controls = (control as { controls: Record<string, AbstractControl> }).controls;
    Object.values(controls).forEach((ctrl) => {
      markAllAsTouched(ctrl);
    });
  }
}
