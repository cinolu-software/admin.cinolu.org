import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FilterArticleDto } from '../../dto/filter-article.dto';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Eye, Funnel, LucideAngularModule, Pencil, Plus, Search, Trash } from 'lucide-angular';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { ArticlesStore } from '../../store/articles.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiAvatar, UiButton, UiConfirmDialog, UiPagination, UiTabs, UiBadge } from '@shared/ui';
import { IArticle } from '@shared/models';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-article-list',
  providers: [ArticlesStore],
  imports: [
    LucideAngularModule,
    CommonModule,
    UiButton,
    ReactiveFormsModule,
    RouterLink,
    UiAvatar,
    ApiImgPipe,
    UiConfirmDialog,
    UiTabs,
    UiPagination,
    UiTableSkeleton,
    UiBadge
  ],
  templateUrl: './list-articles.html'
})
export class ListArticles {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  store = inject(ArticlesStore);
  itemsPerPage = 20;
  icons = { Pencil, Trash, Search, Plus, Eye, Funnel };
  queryParams = signal<FilterArticleDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q'),
    filter: (this.#route.snapshot.queryParamMap.get('filter') as FilterArticleDto['filter']) || 'all'
  });
  activeTab = computed(() => this.queryParams().filter || 'all');
  currentPage = computed(() => Number(this.queryParams().page) || 1);
  searchForm: FormGroup = this.#fb.group({
    q: [this.queryParams().q || '']
  });
  tabsConfig = signal([
    { name: 'all', label: 'Tous' },
    { name: 'published', label: 'Publiés' },
    { name: 'drafts', label: 'Brouillons' },
    { name: 'highlighted', label: 'En vedette' }
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
    const filter = tabName as FilterArticleDto['filter'];
    this.queryParams.update((qp) => ({ ...qp, filter, page: null }));
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
    this.#router.navigate(['/blog/articles'], { queryParams });
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

  onDelete(articleId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer cet article ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete(articleId);
      }
    });
  }

  isPublished(article: IArticle): boolean {
    return !!article.published_at && new Date(article.published_at) <= new Date();
  }
}
