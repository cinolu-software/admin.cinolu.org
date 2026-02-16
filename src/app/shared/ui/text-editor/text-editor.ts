import { Component, input, forwardRef, signal, effect, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  LucideAngularModule,
  Bold,
  Italic,
  Underline,
  List,
  TextAlignStart,
  TextAlignCenter,
  TextAlignEnd
} from 'lucide-angular';

@Component({
  selector: 'app-ui-text-editor',
  imports: [LucideAngularModule],
  templateUrl: './text-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiTextEditor), multi: true }]
})
export class UiTextEditor implements ControlValueAccessor, AfterViewInit {
  @ViewChild('editor', { static: false }) editorElement!: ElementRef<HTMLDivElement>;

  placeholder = input<string>('Start typing...');
  disabled = input<boolean>(false);
  id = input<string>('');
  invalid = input<boolean>(false);
  minHeight = input<string>('300px');
  value = signal('');
  isFocused = signal(false);
  icons = { Bold, Italic, Underline, List, TextAlignCenter, TextAlignStart, TextAlignEnd };

  onChange!: (value: string) => void;
  onTouched!: () => void;

  constructor() {
    effect(() => {
      if (this.disabled() && this.editorElement) {
        this.editorElement.nativeElement.contentEditable = 'false';
      }
    });

    effect(() => {
      const currentValue = this.value();
      if (this.editorElement && currentValue !== undefined) {
        const editorContent = this.editorElement.nativeElement.innerHTML;
        if (editorContent !== currentValue) {
          this.editorElement.nativeElement.innerHTML = currentValue || '';
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.editorElement && this.value()) {
      this.editorElement.nativeElement.innerHTML = this.value();
    }
  }

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.editorElement) {
      this.editorElement.nativeElement.contentEditable = (!isDisabled).toString();
    }
  }

  onInput(): void {
    if (this.editorElement) {
      const newValue = this.editorElement.nativeElement.innerHTML;
      this.value.set(newValue);
      this.onChange(newValue);
    }
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  execCommand(command: string, value: string | undefined = undefined): void {
    document.execCommand(command, false, value);
    this.editorElement?.nativeElement.focus();
    this.onInput();
  }

  formatBold(): void {
    this.execCommand('bold');
  }

  formatItalic(): void {
    this.execCommand('italic');
  }

  formatUnderline(): void {
    this.execCommand('underline');
  }

  insertBulletList(): void {
    this.execCommand('insertUnorderedList');
  }

  insertOrderedList(): void {
    this.execCommand('insertOrderedList');
  }

  alignLeft(): void {
    this.execCommand('justifyLeft');
  }

  alignCenter(): void {
    this.execCommand('justifyCenter');
  }

  alignRight(): void {
    this.execCommand('justifyRight');
  }

  insertLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      this.execCommand('createLink', url);
    }
  }

  insertImage(): void {
    const url = prompt('Enter image URL:');
    if (url) {
      this.execCommand('insertImage', url);
    }
  }

  formatCode(): void {
    this.execCommand('formatBlock', 'pre');
  }

  editorClasses(): string {
    const baseClasses = 'ui-text-editor-content';
    const focusedClass = this.isFocused() ? 'ui-text-editor-focused' : '';
    const invalidClass = this.invalid() ? 'ui-text-editor-invalid' : '';
    const disabledClass = this.disabled() ? 'ui-text-editor-disabled' : '';
    return [baseClasses, focusedClass, invalidClass, disabledClass].filter(Boolean).join(' ');
  }

  toolbarClasses(): string {
    return 'ui-text-editor-toolbar';
  }

  buttonClasses(isActive = false): string {
    const baseClasses = 'ui-text-editor-button';
    const activeClass = isActive ? 'ui-text-editor-button-active' : '';
    return [baseClasses, activeClass].filter(Boolean).join(' ');
  }
}
