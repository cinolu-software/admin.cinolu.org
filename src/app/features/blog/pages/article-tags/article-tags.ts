import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Plus, Search, Trash, Funnel, Pencil } from 'lucide-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TagsStore } from '../../store/tag.store';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterArticlesTagsDto } from '../../dto/filter-tags.dto';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiButton, UiConfirmDialog, UiInput, UiPagination } from '@shared/ui';
import { ITag } from '@shared/models';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-article-tags',
  providers: [TagsStore],
  imports: [
    LucideAngularModule,
    ReactiveFormsModule,
    UiButton,
    UiInput,
    UiConfirmDialog,
    UiPagination,
    UiTableSkeleton,
    CommonModule
  ],
  templateUrl: './article-tags.html'
})
export class ArticleTags {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  searchForm: FormGroup;
  tagForm: FormGroup;
  store = inject(TagsStore);
  itemsPerPage = 10;
  icons = { Pencil, Trash, Plus, Search, Funnel };
  queryParams = signal<FilterArticlesTagsDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q')
  });
  currentPage = computed(() => Number(this.queryParams().page) || 1);
  formVisible = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  editingTag = signal<ITag | null>(null);

  constructor() {
    this.searchForm = this.#fb.group({
      q: [this.queryParams().q || '']
    });
    this.tagForm = this.#fb.group({
      id: [''],
      name: ['', Validators.required]
    });

    effect(() => {
      this.store.loadAll(this.queryParams());
    });
    const searchValue = this.searchForm.get('q');
    searchValue?.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged(), takeUntilDestroyed(this.#destroyRef))
      .subscribe((searchValue: string) => {
        this.queryParams.update((qp) => ({
          ...qp,
          q: searchValue ? searchValue.trim() : null,
          page: null
        }));
        this.updateRoute();
      });
  }

  onPageChange(currentPage: number): void {
    this.queryParams.update((qp) => ({
      ...qp,
      page: currentPage === 1 ? null : currentPage.toString()
    }));
    this.updateRoute();
  }

  updateRoute(): void {
    const queryParams = this.queryParams();
    this.#router.navigate(['/blog/tags'], { queryParams });
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({
      ...qp,
      q: null,
      page: null
    }));
    this.updateRoute();
  }

  onDelete(id: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer ce tag ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete({ id });
      }
    });
  }

  onToggleForm(tag: ITag | null = null): void {
    if (tag) {
      this.formMode.set('edit');
      this.editingTag.set(tag);
      this.tagForm.patchValue({
        id: tag.id,
        name: tag.name
      });
      this.formVisible.set(true);
      return;
    }

    this.formMode.set('create');
    this.editingTag.set(null);
    this.tagForm.reset({
      id: '',
      name: ''
    });
    this.formVisible.update((visible) => !visible);
  }

  onCancelForm(): void {
    this.formVisible.set(false);
    this.formMode.set('create');
    this.editingTag.set(null);
    this.tagForm.reset({
      id: '',
      name: ''
    });
  }

  onSubmit(): void {
    if (this.tagForm.invalid) return;
    const { id, name } = this.tagForm.value;
    if (this.formMode() === 'edit' && id) {
      this.store.update({
        id,
        payload: { id, name },
        onSuccess: () => this.onCancelForm()
      });
      return;
    }

    this.store.create({
      payload: { name },
      onSuccess: () => this.onCancelForm()
    });
  }
}
