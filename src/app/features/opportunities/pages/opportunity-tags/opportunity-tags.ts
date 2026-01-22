import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Plus, Search, Trash, Funnel, Pencil } from 'lucide-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OpportunityTagsStore } from '../../store/opportunity-tags.store';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterOpportunityTagsDto } from '../../dto/tags/filter-tags.dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiButton, UiConfirmDialog, UiInput, UiPagination, UiBadge } from '@shared/ui';
import { ITag } from '@shared/models';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-opportunity-tags',
  providers: [OpportunityTagsStore],
  imports: [
    LucideAngularModule,
    ReactiveFormsModule,
    UiButton,
    UiInput,
    UiConfirmDialog,
    UiPagination,
    UiTableSkeleton,
    UiBadge
  ],
  templateUrl: './opportunity-tags.html'
})
export class OpportunityTags {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  searchForm: FormGroup;
  createForm: FormGroup;
  updateForm: FormGroup;
  store = inject(OpportunityTagsStore);
  itemsPerPage = 10;
  icons = { Pencil, Trash, Plus, Search, Funnel };
  queryParams = signal<FilterOpportunityTagsDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q')
  });
  currentPage = computed(() => Number(this.queryParams().page) || 1);
  isCreating = signal(false);
  editingTagId = signal<string | null>(null);

  constructor() {
    this.searchForm = this.#fb.group({
      q: [this.queryParams().q || '']
    });
    this.createForm = this.#fb.group({
      name: ['', Validators.required]
    });
    this.updateForm = this.#fb.group({
      name: ['', Validators.required]
    });
    effect(() => {
      this.store.loadFiltered(this.queryParams());
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
    this.#router.navigate(['/opportunity-tags'], { queryParams });
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

  onToggleCreation(): void {
    this.isCreating.update((visible) => !visible);
    if (!this.isCreating()) {
      this.createForm.reset({ name: '' });
    }
  }

  onCancelCreation(): void {
    this.isCreating.set(false);
    this.createForm.reset({ name: '' });
  }

  onCreate(): void {
    if (this.createForm.invalid) return;
    const { name } = this.createForm.value;
    this.store.create({
      payload: { name },
      onSuccess: () => this.onCancelCreation()
    });
  }

  onEdit(tag: ITag): void {
    this.editingTagId.set(tag.id);
    this.updateForm.patchValue({ name: tag.name });
  }

  onCancelUpdate(): void {
    this.editingTagId.set(null);
    this.updateForm.reset({ name: '' });
  }

  onUpdate(): void {
    if (this.updateForm.invalid) return;
    const { name } = this.updateForm.value;
    this.store.update({
      id: this.editingTagId() || '',
      payload: { name },
      onSuccess: () => this.onCancelUpdate()
    });
  }

  isEditing(tagId: string): boolean {
    return this.editingTagId() === tagId;
  }
}
