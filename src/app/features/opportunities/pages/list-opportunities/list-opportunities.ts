import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Trash, Search, Funnel, Eye } from 'lucide-angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { OpportunitiesStore } from '../../store/opportunities.store';
import { FilterOpportunitiesDto } from '../../dto/opportunities/filter-opportunities.dto';
import { UiButton, UiConfirmDialog, UiPagination, UiBadge } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { ConfirmationService } from '@shared/services/confirmation';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-list-opportunities',
  templateUrl: './list-opportunities.html',
  providers: [OpportunitiesStore],
  imports: [
    LucideAngularModule,
    DatePipe,
    UiButton,
    ReactiveFormsModule,
    UiConfirmDialog,
    RouterLink,
    UiPagination,
    UiTableSkeleton,
    UiBadge
  ]
})
export class ListOpportunities {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  #fb = inject(FormBuilder);
  store = inject(OpportunitiesStore);
  queryParams = signal<FilterOpportunitiesDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q')
  });
  searchForm: FormGroup = this.#fb.group({
    q: [this.queryParams().q || '']
  });
  icons = { Trash, Search, Funnel, Eye };
  itemsPerPage = 20;

  currentPage = (): number => {
    const page = this.queryParams().page;
    return page ? parseInt(page, 10) : 1;
  };

  constructor() {
    effect(() => {
      this.updateRouteAndOpportunities();
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
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({
      ...qp,
      page: currentPage === 1 ? null : currentPage.toString()
    }));
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.set({ page: null, q: null });
  }

  onDelete(opportunityId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cette opportunité ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete(opportunityId);
      }
    });
  }

  updateRoute(): void {
    const queryParams = this.queryParams();
    this.#router.navigate(['/opportunities'], { queryParams });
  }

  updateRouteAndOpportunities(): void {
    this.updateRoute();
    this.store.loadAll(this.queryParams());
  }
}
