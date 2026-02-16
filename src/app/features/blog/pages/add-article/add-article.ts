import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton, UiInput, UiTextarea, UiMultiSelect, UiDatepicker, UiTextEditor } from '@shared/ui';
import { ArticlesStore } from '../../store/articles.store';
import { TagsStore } from '../../store/tags.store';

@Component({
  selector: 'app-article-add',
  providers: [ArticlesStore, TagsStore],
  imports: [ReactiveFormsModule, UiButton, UiInput, UiTextarea, UiMultiSelect, UiDatepicker, UiTextEditor],
  templateUrl: './add-article.html',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddArticle {
  #fb = inject(FormBuilder);
  form: FormGroup;
  store = inject(ArticlesStore);
  tagsStore = inject(TagsStore);

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
