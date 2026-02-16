import { Component, computed, DestroyRef, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule, Trash, Search, Funnel, Eye } from 'lucide-angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProjectsStore } from '../../store/projects.store';
import { FilterProjectsDto } from '../../dto/projects/filter-projects.dto';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar, UiButton, UiConfirmDialog, UiTabs, UiPagination, UiBadge } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { ConfirmationService } from '@shared/services/confirmation';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-list-projects',
  templateUrl: './list-projects.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectsStore],
  imports: [
    LucideAngularModule,
    DatePipe,
    UiButton,
    ReactiveFormsModule,
    UiConfirmDialog,
    ApiImgPipe,
    UiAvatar,
    RouterLink,
    UiTabs,
    UiPagination,
    UiTableSkeleton,
    UiBadge
  ]
})
export class ListProjects {
  #route = inject(ActivatedRoute);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  #fb = inject(FormBuilder);
  store = inject(ProjectsStore);
  queryParams = signal<FilterProjectsDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q'),
    filter: this.#route.snapshot.queryParamMap.get('filter')
  });
  searchForm: FormGroup = this.#fb.group({
    q: [this.queryParams().q || '']
  });
  icons = { Trash, Search, Funnel, Eye };
  itemsPerPage = 20;
  activeTab = computed(() => this.queryParams().filter || 'all');
  tabsConfig = signal([
    { label: 'Tous', name: 'all' },
    { label: 'Publiés', name: 'published' },
    { label: 'Brouillons', name: 'drafts' },
    { label: 'En vedette', name: 'highlighted' }
  ]);

  currentPage = (): number => {
    const page = this.queryParams().page;
    return page ? parseInt(page, 10) : 1;
  };

  constructor() {
    effect(() => {
      this.updateRouteAndProjects();
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

  onTabChange(tabName: string): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({
      ...qp,
      page: null,
      filter: tabName === 'all' ? null : tabName
    }));
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
    this.queryParams.set({ page: null, q: null, filter: null });
  }

  onDelete(projectId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: 'Etes-vous sûr de vouloir supprimer ce projet ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete(projectId);
      }
    });
  }

  updateRouteAndProjects(): void {
    this.store.loadAll(this.queryParams());
  }
}
