import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Users, Search, CircleArrowRight, X, Check, Upload, Eye, Trash2 } from 'lucide-angular';
import { startWith } from 'rxjs';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar, UiBadge, UiButton, UiPagination, UiSelect } from '@shared/ui';
import { IPhase, IProject, ProjectParticipation } from '@shared/models';
import { PhasesStore } from '@features/projects/store/phases.store';
import { ProjectsStore } from '@features/projects/store/projects.store';
import { ParticipationDetailOverlay } from './participation-detail/participation-detail-overlay';

const PAGE_SIZE = 20;
const OPERATION_MOVE = 'move';
const OPERATION_REMOVE = 'remove';

function getParticipationKey(p: ProjectParticipation): string {
  return `${p.user.id}-${p.venture?.id ?? 'none'}`;
}

@Component({
  selector: 'app-participations',
  templateUrl: './participations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectsStore, PhasesStore],
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    ApiImgPipe,
    UiAvatar,
    UiBadge,
    UiButton,
    UiPagination,
    UiSelect,
    ParticipationDetailOverlay
  ]
})
export class Participations {
  project = input.required<IProject | null>();
  sortedPhases = input.required<IPhase[]>();
  phasesStore = inject(PhasesStore);
  projectsStore = inject(ProjectsStore);
  selectedPhase = signal<string | null>(null);
  selectedIds = signal<Set<string>>(new Set());
  selectedParticipationForDetail = signal<ProjectParticipation | null>(null);
  operationTypeControl = new FormControl<string>(OPERATION_MOVE, { nonNullable: true });
  moveTargetPhaseControl = new FormControl<string | null>(null);
  removeTargetPhaseControl = new FormControl<string | null>(null);
  form = new FormGroup({
    search: new FormControl<string>('', { nonNullable: true })
  });
  currentPage = signal(1);
  icons = { Users, Search, CircleArrowRight, X, Check, Upload, Eye, Trash2 };
  selectedCsvFile = signal<File | null>(null);
  csvFileInput = viewChild<ElementRef<HTMLInputElement>>('csvFileInput');
  movePhaseOptions = computed(() => this.sortedPhases().map((p) => ({ label: p.name, value: p.id })));
  operationTypeOptions = [
    { label: 'Déplacer vers une phase', value: OPERATION_MOVE },
    { label: "Retirer d'une phase", value: OPERATION_REMOVE }
  ];
  selectedCount = computed(() => this.selectedIds().size);
  isAllFilteredSelected = computed(() => {
    const ids = this.selectedIds();
    const filtered = this.filteredParticipations();
    return filtered.length > 0 && filtered.every((p) => ids.has(getParticipationKey(p)));
  });
  searchValue = toSignal(
    (this.form.get('search') as FormControl<string>).valueChanges.pipe(
      startWith((this.form.get('search') as FormControl<string>).value)
    ),
    { initialValue: '' }
  );

  rawParticipations = computed(() => this.projectsStore.participations());

  participationsByPhase = computed(() => {
    const list = this.rawParticipations();
    const phaseId = this.selectedPhase();
    if (!phaseId) return list;
    return list.filter((p) => p.phase?.some((ph) => ph.id === phaseId) ?? false);
  });

  filteredParticipations = computed(() => {
    const list = this.participationsByPhase();
    const q = (this.searchValue() ?? '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        (p.user.name ?? '').toLowerCase().includes(q) ||
        (p.user.email ?? '').toLowerCase().includes(q) ||
        (p.venture?.name ?? '').toLowerCase().includes(q)
    );
  });

  paginatedParticipations = computed(() => {
    const list = this.filteredParticipations();
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  });

  currentPhase = computed(() => {
    const phaseId = this.selectedPhase();
    if (!phaseId) return null;
    return this.sortedPhases().find((p) => p.id === phaseId) ?? null;
  });

  totalParticipations = computed(() => this.rawParticipations().length);
  phaseCounts = computed(() => {
    const phases = this.sortedPhases();
    const list = this.rawParticipations();
    return new Map(phases.map((ph) => [ph.id, list.filter((p) => p.phase?.some((x) => x.id === ph.id)).length]));
  });

  readonly pageSize = PAGE_SIZE;
  readonly operationMove = OPERATION_MOVE;
  readonly operationRemove = OPERATION_REMOVE;

  constructor() {
    effect(() => {
      const proj = this.project();
      if (proj?.id) this.projectsStore.loadParticipations(proj.id);
    });

    effect(() => {
      this.searchValue();
      this.selectedPhase();
      this.currentPage.set(1);
      this.clearSelection();
    });
  }

  participationKey(p: ProjectParticipation): string {
    return getParticipationKey(p);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  selectPhase(phaseId: string | null): void {
    this.selectedPhase.set(phaseId);
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
      this.selectedIds.set(new Set(this.filteredParticipations().map((p) => getParticipationKey(p))));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  isSelected(p: ProjectParticipation): boolean {
    return this.selectedIds().has(getParticipationKey(p));
  }

  openDetail(p: ProjectParticipation): void {
    this.selectedParticipationForDetail.set(p);
  }

  closeDetail(): void {
    this.selectedParticipationForDetail.set(null);
  }

  moveToPhase(): void {
    const phaseId = this.moveTargetPhaseControl.value;
    const ids = this.getParticipationsIds();
    const proj = this.project();
    if (!phaseId || ids.length === 0 || !proj?.slug) return;
    this.phasesStore.moveParticipations({
      dto: { ids, phaseId },
      onSuccess: () => {
        this.projectsStore.loadOne(proj.slug);
        if (proj.id) this.projectsStore.loadParticipations(proj.id);
        this.clearSelection();
        this.moveTargetPhaseControl.setValue(null);
      }
    });
  }

  removeFromPhase(): void {
    const phaseId = this.removeTargetPhaseControl.value;
    const ids = this.getParticipationsIds();
    const proj = this.project();
    if (!phaseId || ids.length === 0 || !proj?.slug) return;
    this.phasesStore.removeParticipations({
      dto: { ids, phaseId },
      onSuccess: () => {
        this.projectsStore.loadOne(proj.slug);
        if (proj.id) this.projectsStore.loadParticipations(proj.id);
        this.clearSelection();
        this.removeTargetPhaseControl.setValue(null);
      }
    });
  }

  private getParticipationsIds(): string[] {
    const ids = this.selectedIds();
    return this.filteredParticipations()
      .filter((p) => ids.has(getParticipationKey(p)))
      .map((p) => p.id);
  }

  triggerCsvFileSelect(): void {
    this.csvFileInput()?.nativeElement?.click();
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file?.name.toLowerCase().endsWith('.csv')) {
      this.selectedCsvFile.set(file);
    } else if (file) {
      this.selectedCsvFile.set(null);
    }
    input.value = '';
  }

  clearCsvSelection(): void {
    this.selectedCsvFile.set(null);
  }

  importCsv(): void {
    const proj = this.project();
    const file = this.selectedCsvFile();
    if (!proj?.id || !proj?.slug || !file) return;

    this.projectsStore.importParticipantsCsv({
      projectId: proj.id,
      file,
      onSuccess: () => {
        this.projectsStore.loadOne(proj.slug);
        if (proj.id) this.projectsStore.loadParticipations(proj.id);
        this.clearCsvSelection();
      }
    });
  }
}
