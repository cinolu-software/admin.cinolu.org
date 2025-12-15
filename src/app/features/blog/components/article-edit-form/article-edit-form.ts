import { Component, effect, inject, input, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton, UiInput, UiTextarea, UiMultiSelect, UiDatepicker, UiTextEditor } from '@shared/ui';
import { Calendar, Check, FileText, Info, List, PenLine, Tag, LucideAngularModule } from 'lucide-angular';
import { IArticle } from '@shared/models';
import { ArticlesStore } from '../../store/articles.store';
import { TagsStore } from '../../store/tag.store';

@Component({
  selector: 'app-article-edit-form',
  templateUrl: './article-edit-form.html',
  providers: [ArticlesStore, TagsStore],
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    UiButton,
    UiInput,
    UiTextarea,
    UiMultiSelect,
    UiDatepicker,
    UiTextEditor
  ]
})
export class ArticleEditFormComponent {
  article = input.required<IArticle>();
  #fb = inject(FormBuilder);
  updateStore = inject(ArticlesStore);
  tagsStore = inject(TagsStore);
  form = this.#initForm();
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

  #initForm(): FormGroup {
    return this.#fb.group({
      id: ['', Validators.required],
      title: ['', Validators.required],
      published_at: ['', Validators.required],
      content: ['', Validators.required],
      summary: ['', Validators.required],
      tags: [[], Validators.required]
    });
  }

  constructor() {
    effect(() => {
      this.#patchForm(this.article());
    });
    this.tagsStore.loadUpaginated();
  }

  #patchForm(article: IArticle): void {
    this.form.patchValue({
      ...article,
      published_at: new Date(article.published_at),
      tags: article.tags?.map((c) => c.id)
    });
  }

  onSubmit(): void {
    if (this.form.valid) this.updateStore.update(this.form.value);
  }
}
