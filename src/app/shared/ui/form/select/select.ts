import {
  Component,
  input,
  forwardRef,
  computed,
  signal,
  ElementRef,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

export interface SelectOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

@Component({
  selector: 'app-ui-select',
  imports: [LucideAngularModule],
  templateUrl: './select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)'
  },
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
  required = input<boolean>(false);
  optionLabel = input<string>('');
  optionValue = input<string>('');
  icons = { ChevronDown };
  value = signal<unknown>('');
  isOpen = signal(false);
  #elementRef = inject(ElementRef);

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

  selectedOption = computed(() => {
    return this.normalizedOptions().find((opt) => String(opt.value) === String(this.value()));
  });

  displayText = computed(() => {
    const selected = this.selectedOption();
    return selected ? selected.label : '';
  });

  #onChangeCallback!: (value: unknown) => void;
  onTouched!: () => void;

  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }
    const target = event.target as HTMLElement;
    const element = this.#elementRef.nativeElement;
    if (!element.contains(target)) {
      this.isOpen.set(false);
    }
  }

  writeValue(value: unknown): void {
    this.value.set(value ?? '');
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

  toggleDropdown(): void {
    if (!this.disabled()) {
      this.isOpen.set(!this.isOpen());
      if (this.isOpen()) {
        this.onTouched();
      }
    }
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) {
      return;
    }
    this.value.set(option.value);
    this.#onChangeCallback(this.value());
    this.isOpen.set(false);
    this.onTouched();
  }

  selectClasses(): string {
    const baseClasses = 'ui-select';
    const invalidClass = this.invalid() ? 'ui-select-invalid' : '';
    const disabledClass = this.disabled() ? 'ui-select-disabled' : '';
    return [baseClasses, invalidClass, disabledClass].filter(Boolean).join(' ');
  }

  isSelected(optionValue: unknown): boolean {
    return String(this.value()) === String(optionValue);
  }
}
