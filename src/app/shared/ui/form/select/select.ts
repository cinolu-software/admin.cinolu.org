import { Component, input, forwardRef, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

export interface SelectOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

@Component({
  selector: 'ui-select',
  imports: [LucideAngularModule],
  templateUrl: './select.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSelect), multi: true }]
})
export class UiSelect implements ControlValueAccessor {
  label = input<string>('');
  options = input<SelectOption[] | unknown[]>([]);
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  id = input<string>('');
  invalid = input<boolean>(false);
  filter = input<boolean>(false);
  optionLabel = input<string>('');
  optionValue = input<string>('');
  icons = { ChevronDown };

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

  value: unknown = '';

  #onChangeCallback!: (value: unknown) => void;
  onTouched!: () => void;

  writeValue(value: unknown): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.#onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    void _isDisabled;
  }

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.#onChangeCallback(this.value);
  }

  selectClasses() {
    const baseClasses = 'ui-select';
    const invalidClass = this.invalid() ? 'ui-select-invalid' : '';
    const disabledClass = this.disabled() ? 'ui-select-disabled' : '';
    return [baseClasses, invalidClass, disabledClass].filter(Boolean).join(' ');
  }
}
