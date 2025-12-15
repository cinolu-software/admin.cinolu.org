import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Trash, Download, Search, Funnel, Pencil } from 'lucide-angular';
import { UsersStore } from '../../store/users.store';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FilterUsersDto } from '../../dto/users/filter-users.dto';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UiAvatar, UiButton, UiConfirmDialog, UiPagination } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { ConfirmationService } from '@shared/services/confirmation';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.html',
  providers: [UsersStore],
  imports: [
    LucideAngularModule,
    CommonModule,
    UiButton,
    ApiImgPipe,
    UiAvatar,
    ReactiveFormsModule,
    UiConfirmDialog,
    UiPagination,
    UiTableSkeleton,
    RouterLink
  ]
})
export class ListUsers {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  store = inject(UsersStore);
  queryParams = signal<FilterUsersDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q')
  });
  searchForm: FormGroup = this.#fb.group({
    q: [this.queryParams().q || '']
  });
  icons = { Trash, Download, Search, Funnel, Pencil };
  itemsPerPage = 10;

  currentPage = computed(() => {
    const page = this.queryParams().page;
    return page ? parseInt(page, 10) : 1;
  });

  constructor() {
    effect(() => {
      this.updateRouteAndUsers();
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
    this.#router.navigate(['/users'], { queryParams });
  }

  updateRouteAndUsers(): void {
    this.updateRoute();
    this.store.loadAll(this.queryParams());
  }

  onDownloadUsers(): void {
    this.store.download(this.queryParams());
  }

  onDelete(userId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete(userId);
      }
    });
  }
}
