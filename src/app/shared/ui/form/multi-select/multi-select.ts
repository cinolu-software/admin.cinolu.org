import { Component, input, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectOption } from '../select/select';

@Component({
  selector: 'ui-multi-select',
  imports: [CommonModule],
  templateUrl: './multi-select.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiMultiSelect), multi: true }]
})
export class UiMultiSelect implements ControlValueAccessor {
  label = input<string>('');
  options = input<SelectOption[] | unknown[]>([]);
  placeholder = input<string>('Select items');
  disabled = input<boolean>(false);
  id = input<string>('');
  invalid = input<boolean>(false);
  display = input<'comma' | 'chip'>('comma');
  inputId = input<string>('');
  autocomplete = input<string>('off');
  showHeader = input<boolean>(true);
  optionLabel = input<string>('');
  optionValue = input<string>('');

  value: unknown[] = [];
  isOpen = signal(false);

  normalizedOptions = computed(() => {
    const opts = this.options();
    const labelKey = this.optionLabel();
    const valueKey = this.optionValue();

    if (labelKey && valueKey) {
      return (opts as Record<string, unknown>[]).map((opt) => ({
        label: String(opt[labelKey] ?? ''),
        value: opt[valueKey],
        disabled: false
      }));
    }

    return opts as SelectOption[];
  });

  selectedLabels = computed(() => {
    const selectedOptions = this.normalizedOptions().filter((opt) => this.value.includes(opt.value));
    return selectedOptions.map((opt) => opt.label);
  });

  onChange!: (value: unknown[]) => void;
  onTouched!: () => void;

  writeValue(value: unknown[]): void {
    this.value = value || [];
  }

  registerOnChange(fn: (value: unknown[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    void _isDisabled;
  }

  toggleDropdown(): void {
    if (!this.disabled()) {
      this.isOpen.set(!this.isOpen());
    }
  }

  isSelected(optionValue: unknown): boolean {
    return this.value.includes(optionValue);
  }

  toggleOption(optionValue: unknown): void {
    if (this.isSelected(optionValue)) {
      this.value = this.value.filter((v) => v !== optionValue);
    } else {
      this.value = [...this.value, optionValue];
    }
    this.onChange(this.value);
  }

  removeItem(optionValue: unknown, event: Event): void {
    event.stopPropagation();
    this.value = this.value.filter((v) => v !== optionValue);
    this.onChange(this.value);
  }

  selectClasses() {
    // Only return conditional classes, base styles are in CSS
    const classes: string[] = [];
    if (this.invalid()) {
      classes.push('border-red-500');
    }
    return classes.join(' ');
  }
}
