import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Users, Layers, Calendar, Search, CircleArrowRight, X, Check } from 'lucide-angular';
import { startWith } from 'rxjs';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar, UiBadge, UiButton, UiPagination, UiSelect } from '@shared/ui';
import type { IPhase, IProject } from '@shared/models';
import { PhasesStore } from '@features/projects/store/phases.store';
import { ProjectsStore } from '@features/projects/store/projects.store';

const ALL_VALUE = '__all__';
const PAGE_SIZE = 20;

@Component({
  selector: 'app-participants',
  templateUrl: './participants.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    LucideAngularModule,
    ApiImgPipe,
    UiAvatar,
    UiBadge,
    UiButton,
    UiPagination,
    UiSelect
  ]
})
export class Participants {
  project = input.required<IProject | null>();
  sortedPhases = input.required<IPhase[]>();
  phasesStore = inject(PhasesStore);
  #projectsStore = inject(ProjectsStore);
  selectedIds = signal<Set<string>>(new Set());
  moveTargetPhaseControl = new FormControl<string | null>(null);
  form = new FormGroup({
    phase: new FormControl<string | null>(ALL_VALUE),
    search: new FormControl<string>('', { nonNullable: true })
  });
  currentPage = signal(1);
  icons = { Users, Layers, Calendar, Search, CircleArrowRight, Check, X };
  movePhaseOptions = computed(() => this.sortedPhases().map((p) => ({ label: p.name, value: p.id })));
  selectedCount = computed(() => this.selectedIds().size);
  isAllFilteredSelected = computed(() => {
    const ids = this.selectedIds();
    const filtered = this.filteredParticipants();
    return filtered.length > 0 && filtered.every((p) => ids.has(p.id));
  });
  isSomeSelected = computed(() => this.selectedIds().size > 0);
  phaseOptions = computed(() => {
    const options = [{ label: 'Tous les participants', value: ALL_VALUE }];
    this.sortedPhases().forEach((phase) => {
      options.push({
        label: phase.name,
        value: phase.id
      });
    });
    return options;
  });

  phaseValue = toSignal(
    (this.form.get('phase') as FormControl<string | null>).valueChanges.pipe(
      startWith((this.form.get('phase') as FormControl<string | null>).value)
    ),
    { initialValue: ALL_VALUE as string | null }
  );

  searchValue = toSignal(
    (this.form.get('search') as FormControl<string>).valueChanges.pipe(
      startWith((this.form.get('search') as FormControl<string>).value)
    ),
    { initialValue: '' }
  );

  rawParticipants = computed(() => {
    const proj = this.project();
    const value = this.phaseValue();
    if (!proj) return [];
    if (value === ALL_VALUE || !value) return proj.participants ?? [];
    const phase = proj.phases?.find((p) => p.id === value);
    return phase?.participants ?? [];
  });

  filteredParticipants = computed(() => {
    const list = this.rawParticipants();
    const q = (this.searchValue() ?? '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q));
  });

  paginatedParticipants = computed(() => {
    const list = this.filteredParticipants();
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  });

  currentPhase = computed(() => {
    const proj = this.project();
    const value = this.phaseValue();
    if (value === ALL_VALUE || !value || !proj?.phases) return null;
    return proj.phases.find((p) => p.id === value) ?? null;
  });

  readonly pageSize = PAGE_SIZE;
  readonly allValue = ALL_VALUE;

  constructor() {
    effect(() => {
      const options = this.phaseOptions();
      const current = this.form.get('phase')?.value;
      if (options.length > 0 && (!current || !options.some((o) => o.value === current))) {
        this.form.patchValue({ phase: options[0].value }, { emitEvent: false });
      }
    });

    effect(() => {
      this.searchValue();
      this.phaseValue();
      this.currentPage.set(1);
      this.clearSelection();
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  selectPhase(phaseId: string): void {
    this.form.patchValue({ phase: phaseId });
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll(): void {
    if (this.isAllFilteredSelected()) {
      this.clearSelection();
    } else {
      const ids = new Set(this.filteredParticipants().map((p) => p.id));
      this.selectedIds.set(ids);
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  moveToPhase(): void {
    const phaseId = this.moveTargetPhaseControl.value;
    const ids = Array.from(this.selectedIds());
    const proj = this.project();

    if (!phaseId || ids.length === 0 || !proj?.slug) return;

    this.phasesStore.groupParticipants({
      ids,
      phaseId,
      onSuccess: () => {
        this.#projectsStore.loadOne(proj.slug);
        this.clearSelection();
        this.moveTargetPhaseControl.setValue(null);
      }
    });
  }
}
