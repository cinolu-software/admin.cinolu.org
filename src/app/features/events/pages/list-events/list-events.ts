import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, Trash, Search, Eye, Star, Funnel, Pencil } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EventsStore } from '../../store/events.store';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { FilterEventsDto } from '../../dto/categories/filter-events.dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiAvatar, UiButton, UiConfirmDialog, UiPagination, UiTabs } from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { IndicatorsStore } from '@features/programs/store/indicators.store';

@Component({
  selector: 'app-events-list',
  templateUrl: './list-events.html',
  providers: [EventsStore, IndicatorsStore],
  imports: [
    LucideAngularModule,
    CommonModule,
    UiButton,
    ReactiveFormsModule,
    RouterLink,
    UiConfirmDialog,
    UiAvatar,
    ApiImgPipe,
    UiTabs,
    UiPagination,
    UiTableSkeleton
  ]
})
export class ListEvents {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  searchForm: FormGroup;
  store = inject(EventsStore);
  itemsPerPage = 10;
  icons = { Pencil, Trash, Search, Eye, Star, Funnel };
  queryParams = signal<FilterEventsDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q'),
    filter: this.#route.snapshot.queryParamMap.get('filter')
  });
  activeTab = computed(() => this.queryParams().filter || 'all');
  currentPage = computed(() => Number(this.queryParams().page) || 1);
  tabsConfig = signal([
    { label: 'Tous', name: 'all' },
    { label: 'Publiés', name: 'published' },
    { label: 'Brouillons', name: 'drafts' },
    { label: 'En vedette', name: 'highlighted' }
  ]);

  constructor() {
    this.searchForm = this.#fb.group({
      q: [this.queryParams().q || '']
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

  onTabChange(tabName: string): void {
    this.queryParams.update((qp) => ({ ...qp, filter: tabName, page: null }));
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
    this.#router.navigate(['/events'], { queryParams });
  }

  onShowcase(eventId: string): void {
    this.store.showcase(eventId);
  }

  onPublish(eventId: string): void {
    this.store.publish(eventId);
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({
      ...qp,
      q: null,
      page: null,
      filter: 'all'
    }));
    this.updateRoute();
  }

  onDelete(eventId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer cet événement ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete(eventId);
      }
    });
  }
}
