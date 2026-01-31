import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Search, Funnel, Eye, CircleCheckBig, CircleX } from 'lucide-angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MentorsStore } from '../../store/mentors.store';
import { FilterMentorsProfileDto } from '../../dto/mentors/filter-mentors-profiles.dto';
import { MentorStatus } from '../../enums/mentor.enum';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiButton, UiPagination, UiTabs, UiBadge } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-mentors-list',
  templateUrl: './list-mentors.html',
  providers: [MentorsStore],
  imports: [
    LucideAngularModule,
    UiButton,
    ReactiveFormsModule,
    RouterLink,
    UiPagination,
    UiTabs,
    UiTableSkeleton,
    UiBadge
  ]
})
export class ListMentors {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #destroyRef = inject(DestroyRef);
  store = inject(MentorsStore);
  itemsPerPage = 20;
  icons = { Eye, Search, Funnel, CircleCheckBig, CircleX };
  queryParams = signal<FilterMentorsProfileDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q'),
    status: (this.#route.snapshot.queryParamMap.get('status') as MentorStatus) || null
  });
  activeTab = computed(() => this.queryParams().status || 'all');
  currentPage = computed(() => Number(this.queryParams().page) || 1);
  searchForm: FormGroup = this.#fb.group({
    q: [this.queryParams().q || '']
  });
  tabsConfig = signal([
    { label: 'Tous', name: 'all' },
    { label: 'En attente', name: MentorStatus.PENDING },
    { label: 'Approuvés', name: MentorStatus.APPROVED },
    { label: 'Rejetés', name: MentorStatus.REJECTED }
  ]);

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

  onTabChange(tabName: string): void {
    const status = tabName as MentorStatus;
    this.queryParams.update((qp) => ({ ...qp, status, page: null }));
    this.updateRoute();
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
    this.#router.navigate(['/mentor-profiles'], { queryParams });
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({ ...qp, q: null, page: null, status: null }));
    this.updateRoute();
  }
}
