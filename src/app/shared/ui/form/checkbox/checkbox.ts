import { Component, input, forwardRef, ChangeDetectionStrategy, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { signal } from '@angular/core';

@Component({
  selector: 'app-ui-checkbox',
  imports: [CommonModule],
  templateUrl: './checkbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiCheckbox), multi: true }]
})
export class UiCheckbox implements ControlValueAccessor {
  label = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  id = input<string>('');
  name = input<string>('');
  invalid = input<boolean>(false);
  @Input() value!: boolean;
  valueChange = output<boolean>();
  isControlDisabled = signal(false);

  onChange: (value: boolean) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: boolean): void {
    this.value = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isControlDisabled.set(isDisabled);
  }

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.checked;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.onTouched();
  }

  checkboxClasses(): string {
    const baseClasses = 'ui-checkbox-input';
    const invalidClasses = this.invalid() ? 'ui-checkbox-invalid' : '';
    const disabledClasses = this.isDisabled() ? 'ui-checkbox-disabled' : '';
    return [baseClasses, invalidClasses, disabledClasses].filter(Boolean).join(' ');
  }

  isDisabled(): boolean {
    return this.disabled() || this.isControlDisabled();
  }
}
