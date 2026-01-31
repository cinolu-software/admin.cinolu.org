import { Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton, UiInput, UiMultiSelect, UiTextEditor } from '@shared/ui';
import { Info, LucideAngularModule } from 'lucide-angular';
import { IArticle } from '@shared/models';
import { ArticlesStore } from '../../store/articles.store';
import { TagsStore } from '../../store/tags.store';

@Component({
  selector: 'app-article-update',
  templateUrl: './article-update.html',
  providers: [ArticlesStore, TagsStore],
  imports: [ReactiveFormsModule, LucideAngularModule, UiButton, UiInput, UiMultiSelect, UiTextEditor]
})
export class ArticleUpdate implements OnInit {
  article = input.required<IArticle>();
  #fb = inject(FormBuilder);
  updateStore = inject(ArticlesStore);
  tagsStore = inject(TagsStore);
  form = this.#initForm();
  icons = { Info };

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

  ngOnInit(): void {
    this.#patchForm(this.article()!);
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
