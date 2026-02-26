import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef
} from '@angular/core';
import { LucideAngularModule, Trash, Download, Search, Funnel, Pencil, Upload } from 'lucide-angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UsersStore } from '../../store/users.store';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { FilterUsersDto } from '../../dto/users/filter-users.dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiAvatar, UiButton, UiConfirmDialog, UiPagination, UiBadge } from '@shared/ui';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersStore],
  imports: [
    LucideAngularModule,
    DatePipe,
    UiButton,
    ReactiveFormsModule,
    RouterLink,
    UiConfirmDialog,
    UiAvatar,
    ApiImgPipe,
    UiPagination,
    UiTableSkeleton,
    UiBadge
  ]
})
export class ListUsers {
  #route = inject(ActivatedRoute);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  #destroyRef = inject(DestroyRef);
  searchForm: FormGroup;
  store = inject(UsersStore);
  itemsPerPage = 50;
  icons = { Pencil, Trash, Search, Funnel, Download, Upload };
  selectedCsvFile = signal<File | null>(null);
  csvFileInput = viewChild<ElementRef<HTMLInputElement>>('csvFileInput');
  queryParams = signal<FilterUsersDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q')
  });
  currentPage = computed(() => Number(this.queryParams().page) || 1);

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
      });
  }

  onPageChange(currentPage: number): void {
    this.queryParams.update((qp) => ({
      ...qp,
      page: currentPage === 1 ? null : currentPage.toString()
    }));
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({ ...qp, q: null, page: null }));
  }

  onDownloadUsers(): void {
    this.store.download(this.queryParams());
  }

  onDelete(userId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete(userId);
      }
    });
  }

  triggerCsvFileSelect(): void {
    this.csvFileInput()?.nativeElement?.click();
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedCsvFile.set(file?.name.toLowerCase().endsWith('.csv') ? file : null);
    input.value = '';
  }

  clearCsvSelection(): void {
    this.selectedCsvFile.set(null);
  }

  onImportCsv(): void {
    const file = this.selectedCsvFile();
    if (!file) return;
    this.store.importCsv({
      file,
      onSuccess: () => {
        this.store.loadAll(this.queryParams());
        this.clearCsvSelection();
      }
    });
  }
}
