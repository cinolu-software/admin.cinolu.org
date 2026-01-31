import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Search, Funnel, Eye, ToggleLeft, ToggleRight } from 'lucide-angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { VenturesStore } from '../../store/ventures.store';
import { FilterVenturesDto } from '../../dto/filter-ventures.dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiButton, UiPagination, UiBadge, UiConfirmDialog } from '@shared/ui';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-list-ventures',
  templateUrl: './list-ventures.html',
  providers: [VenturesStore],
  imports: [
    LucideAngularModule,
    UiButton,
    ReactiveFormsModule,
    RouterLink,
    UiPagination,
    UiTableSkeleton,
    UiBadge,
    ApiImgPipe,
    UiAvatar,
    UiConfirmDialog,
    NgOptimizedImage
  ]
})
export class ListVentures {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #destroyRef = inject(DestroyRef);
  store = inject(VenturesStore);
  itemsPerPage = 20;
  icons = { Eye, Search, Funnel, ToggleLeft, ToggleRight };
  queryParams = signal<FilterVenturesDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q')
  });
  searchForm: FormGroup = this.#fb.group({
    q: [this.queryParams().q || '']
  });
  currentPage = computed(() => Number(this.queryParams().page) || 1);

  constructor() {
    effect(() => {
      this.store.loadAll(this.queryParams());
    });
    const searchValue = this.searchForm.get('q');
    searchValue?.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged(), takeUntilDestroyed(this.#destroyRef))
      .subscribe((searchValue: string) => {
        this.queryParams.update((qp) => ({ ...qp, q: searchValue, page: null }));
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
    this.#router.navigate(['/ventures'], { queryParams });
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({ ...qp, q: null, page: null }));
    this.updateRoute();
  }
}
