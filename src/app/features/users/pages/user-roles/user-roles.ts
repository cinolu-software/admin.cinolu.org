import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Trash, Search, Funnel, Pencil } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilterRolesDto } from '../../dto/roles/filter-roles.dto';
import { RolesStore } from '../../store/roles.store';
import { IRole } from '@shared/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiButton, UiConfirmDialog, UiInput, UiPagination } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { ConfirmationService } from '@shared/services/confirmation';

@Component({
  selector: 'app-user-roles',
  templateUrl: './user-roles.html',
  providers: [RolesStore],
  imports: [
    LucideAngularModule,
    CommonModule,
    UiInput,
    UiButton,
    ReactiveFormsModule,
    UiConfirmDialog,
    UiPagination,
    UiTableSkeleton
  ]
})
export class UserRoles {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  store = inject(RolesStore);
  queryParams = signal<FilterRolesDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q')
  });
  searchForm: FormGroup = this.#fb.group({
    q: [this.queryParams().q || '']
  });
  roleForm: FormGroup = this.#fb.group({
    id: [''],
    name: ['', Validators.required]
  });
  icons = { Pencil, Trash, Search, Funnel };
  itemsPerPage = 10;
  formVisible = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  editingRole = signal<IRole | null>(null);

  currentPage = computed(() => {
    const page = this.queryParams().page;
    return page ? parseInt(page, 10) : 1;
  });

  constructor() {
    effect(() => {
      this.updateRouteAndRoles();
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

  resetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.set({ page: null, q: null });
  }

  updateRoute(): void {
    const queryParams = this.queryParams();
    this.#router.navigate(['/roles'], { queryParams });
  }

  updateRouteAndRoles(): void {
    this.updateRoute();
    this.store.loadAll(this.queryParams());
  }

  onToggleForm(role: IRole | null = null): void {
    if (role) {
      this.formMode.set('edit');
      this.editingRole.set(role);
      this.roleForm.patchValue({ id: role.id, name: role.name });
      this.formVisible.set(true);
      return;
    }
    this.formMode.set('create');
    this.editingRole.set(null);
    this.roleForm.reset({ id: '', name: '' });
    this.formVisible.update((v) => !v);
  }

  onCancelForm(): void {
    this.formVisible.set(false);
    this.formMode.set('create');
    this.editingRole.set(null);
    this.roleForm.reset({ id: '', name: '' });
  }

  onSubmit(): void {
    if (this.roleForm.invalid) return;
    const { id, name } = this.roleForm.value;
    if (this.formMode() === 'edit' && id) {
      this.store.update({
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

  onDelete(roleId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer ce rôle ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete(roleId);
      }
    });
  }
}
