import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Calendar, Check, FileText, Info, List, PenLine, Tag, LucideAngularModule } from 'lucide-angular';
import { UiButton, UiInput, UiTextarea, UiMultiSelect, UiDatepicker, UiTextEditor } from '@shared/ui';
import { ArticlesStore } from '../../store/articles.store';
import { TagsStore } from '../../store/tag.store';

@Component({
  selector: 'app-article-add',
  providers: [ArticlesStore, TagsStore],
  imports: [
    LucideAngularModule,
    CommonModule,
    ReactiveFormsModule,
    UiButton,
    UiInput,
    UiTextarea,
    UiMultiSelect,
    UiDatepicker,
    UiTextEditor
  ],
  templateUrl: './add-article.html'
})
export class AddArticle {
  #fb = inject(FormBuilder);
  form: FormGroup;
  store = inject(ArticlesStore);
  tagsStore = inject(TagsStore);
  icons = {
    penLine: PenLine,
    tag: Tag,
    calendar: Calendar,
    list: List,
    fileText: FileText,
    info: Info,
    check: Check
  };

  tagOptions = computed(() => this.tagsStore.allTags().map((tag) => ({ label: tag.name, value: tag.id })));

  constructor() {
    this.form = this.#fb.group({
      title: ['', Validators.required],
      published_at: [new Date(), Validators.required],
      content: ['', Validators.required],
      summary: ['', Validators.required],
      tags: [[], Validators.required]
    });
    this.tagsStore.loadUpaginated();
  }

  onAddArticle(): void {
    if (!this.form.valid) return;
    this.store.create(this.form.value);
  }
}
