import { Component, input, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-textarea',
  templateUrl: './textarea.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiTextarea), multi: true }]
})
export class UiTextarea implements ControlValueAccessor {
  label = input<string>('');
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  id = input<string>('');
  rows = input<number>(4);
  invalid = input<boolean>(false);
  required = input<boolean>(false);
  value = '';

  onChange!: (value: string) => void;
  onTouched!: () => void;

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    void isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  textareaClasses() {
    const baseClasses = 'ui-textarea';
    const invalidClass = this.invalid() ? 'ui-textarea-invalid' : '';
    const disabledClass = this.disabled() ? 'ui-textarea-disabled' : '';
    return [baseClasses, invalidClass, disabledClass].filter(Boolean).join(' ');
  }
}
