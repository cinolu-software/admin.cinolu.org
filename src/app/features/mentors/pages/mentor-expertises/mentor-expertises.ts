import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Trash, Search, Funnel, Pencil } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IExpertise } from '@shared/models';
import { FilterExpertisesDto } from '../../dto/expertises/filter-expertises.dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ExpertisesStore } from '../../store/expertises.store';
import { UiButton, UiConfirmDialog, UiPagination } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiInput } from '@shared/ui/form/input/input';

@Component({
  selector: 'app-mentor-expertises',
  templateUrl: './mentor-expertises.html',
  providers: [ExpertisesStore, ConfirmationService],
  imports: [LucideAngularModule, UiButton, ReactiveFormsModule, UiConfirmDialog, UiPagination, UiTableSkeleton, UiInput]
})
export class MentorExpertises {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  store = inject(ExpertisesStore);
  queryParams = signal<FilterExpertisesDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q')
  });
  searchForm: FormGroup;
  createForm: FormGroup;
  updateForm: FormGroup;
  icons = { Pencil, Trash, Search, Funnel };
  itemsPerPage = 10;
  isCreating = signal(false);
  editingExpertiseId = signal<string | null>(null);

  currentPage = computed(() => Number(this.queryParams().page) || 1);

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

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({
      ...qp,
      q: null,
      page: null
    }));
    this.updateRoute();
  }

  updateRoute(): void {
    const queryParams = this.queryParams();
    this.#router.navigate(['/expertises'], { queryParams });
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

  onEdit(expertise: IExpertise): void {
    this.editingExpertiseId.set(expertise.id);
    this.updateForm.patchValue({ name: expertise.name });
  }

  onCancelUpdate(): void {
    this.editingExpertiseId.set(null);
    this.updateForm.reset({ name: '' });
  }

  onUpdate(): void {
    if (this.updateForm.invalid) return;
    const { name } = this.updateForm.value;
    this.store.update({
      id: this.editingExpertiseId() || '',
      payload: { name },
      onSuccess: () => this.onCancelUpdate()
    });
  }

  isEditing(expertiseId: string): boolean {
    return this.editingExpertiseId() === expertiseId;
  }

  onDelete(expertiseId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cette expertise ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete({ id: expertiseId });
      }
    });
  }
}
