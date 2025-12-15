import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Trash, Search, Funnel, Pencil } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriesStore } from '../../store/project-categories.store';
import { ICategory } from '@shared/models';
import { FilterProjectCategoriesDto } from '../../dto/categories/filter-categories.dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiButton, UiConfirmDialog, UiPagination } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiInput } from '@shared/ui/form/input/input';

@Component({
  selector: 'app-project-categories',
  templateUrl: './project-categories.html',
  providers: [CategoriesStore],
  imports: [
    LucideAngularModule,
    CommonModule,
    UiButton,
    ReactiveFormsModule,
    UiConfirmDialog,
    UiPagination,
    UiTableSkeleton,
    UiInput
  ]
})
export class ProjectCategories {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  store = inject(CategoriesStore);
  queryParams = signal<FilterProjectCategoriesDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q')
  });
  searchForm: FormGroup = this.#fb.group({
    q: [this.queryParams().q || '']
  });
  categoryForm: FormGroup = this.#fb.group({
    id: [''],
    name: ['', Validators.required]
  });
  icons = { Pencil, Trash, Search, Funnel };
  itemsPerPage = 10;
  formVisible = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  editingCategory = signal<ICategory | null>(null);

  currentPage = computed(() => {
    const page = this.queryParams().page;
    return page ? parseInt(page, 10) : 1;
  });

  constructor() {
    effect(() => {
      this.updateRouteAndCategories();
    });
    const searchInput = this.searchForm.get('q');
    searchInput?.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged(), takeUntilDestroyed(this.#destroyRef))
      .subscribe((searchValue: string) => {
        const nextQ = searchValue ? searchValue.trim() : null;
        this.queryParams.update((qp) => {
          if (qp.q === nextQ && qp.page === null) return qp;
          return { ...qp, page: null, q: nextQ };
        });
      });
  }

  onPageChange(currentPage: number): void {
    this.queryParams.update((qp) => ({
      ...qp,
      page: currentPage === 1 ? null : currentPage.toString()
    }));
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.set({ page: null, q: null });
  }

  updateRoute(): void {
    const queryParams = this.queryParams();
    this.#router.navigate(['/project-categories'], { queryParams });
  }

  updateRouteAndCategories(): void {
    this.updateRoute();
    this.store.loadAll(this.queryParams());
  }

  onToggleForm(category: ICategory | null = null): void {
    if (category) {
      this.formMode.set('edit');
      this.editingCategory.set(category);
      this.categoryForm.patchValue({ id: category.id, name: category.name });
      this.formVisible.set(true);
      return;
    }
    this.formMode.set('create');
    this.editingCategory.set(null);
    this.categoryForm.reset({ id: '', name: '' });
    this.formVisible.update((v) => !v);
  }

  onCancelForm(): void {
    this.formVisible.set(false);
    this.formMode.set('create');
    this.editingCategory.set(null);
    this.categoryForm.reset({ id: '', name: '' });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;
    const { id, name } = this.categoryForm.value;
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

  onDelete(categoryId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete({ id: categoryId });
      }
    });
  }
}
