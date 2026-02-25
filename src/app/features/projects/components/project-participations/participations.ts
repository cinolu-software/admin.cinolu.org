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
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Users,
  Search,
  CircleArrowRight,
  X,
  Check,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-angular';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar, UiBadge, UiButton, UiPagination, UiSelect } from '@shared/ui';
import { IPhase, IProject, IProjectParticipation } from '@shared/models';
import { PhasesStore } from '@features/projects/store/phases.store';
import { ProjectsStore } from '@features/projects/store/projects.store';
import { ParticipationDetail } from './participation-detail/participation-detail';

const PAGE_SIZE = 20;
const OPERATION_MOVE = 'move';
const OPERATION_REMOVE = 'remove';
const OPERATION_TYPE_OPTIONS = [
  { label: 'Déplacer', value: OPERATION_MOVE },
  { label: 'Retirer', value: OPERATION_REMOVE }
];

function getParticipationKey(p: IProjectParticipation): string {
  return `${p.user.id}-${p.venture?.id ?? 'none'}`;
}

@Component({
  selector: 'app-participations',
  templateUrl: './participations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectsStore, PhasesStore],
  imports: [
    FormsModule,
    LucideAngularModule,
    ApiImgPipe,
    UiAvatar,
    UiBadge,
    UiButton,
    UiPagination,
    UiSelect,
    ParticipationDetail
  ]
})
export class Participations {
  project = input.required<IProject | null>();
  readonly phasesStore = inject(PhasesStore);
  readonly projectsStore = inject(ProjectsStore);
  selectedPhase = signal<string | null>(null);
  searchQuery = signal('');
  currentPage = signal(1);
  selectedIds = signal<Set<string>>(new Set());
  expandedParticipationKey = signal<string | null>(null);
  operationType = signal(OPERATION_MOVE);
  moveTargetPhase = signal<string | null>(null);
  removeTargetPhase = signal<string | null>(null);
  selectedCsvFile = signal<File | null>(null);
  csvFileInput = viewChild<ElementRef<HTMLInputElement>>('csvFileInput');
  sortedPhases = signal<IPhase[]>([]);

  readonly icons = { Users, Search, CircleArrowRight, X, Check, Upload, Trash2, ChevronDown, ChevronUp };
  readonly pageSize = PAGE_SIZE;
  readonly operationMove = OPERATION_MOVE;
  readonly operationRemove = OPERATION_REMOVE;
  readonly operationTypeOptions = OPERATION_TYPE_OPTIONS;
  readonly movePhaseOptions = computed(() => this.sortedPhases().map((p) => ({ label: p.name, value: p.id })));
  selectedCount = computed(() => this.selectedIds().size);
  isAllFilteredSelected = computed(() => {
    const ids = this.selectedIds();
    const filtered = this.filteredParticipations();
    return filtered.length > 0 && filtered.every((p) => ids.has(getParticipationKey(p)));
  });
  rawParticipations = computed(() => this.projectsStore.participations());
  participationsByPhase = computed(() => {
    const list = this.rawParticipations();
    const phaseId = this.selectedPhase();
    if (!phaseId) return list;
    return list.filter((p) => p.phases?.some((ph) => ph.id === phaseId) ?? false);
  });
  filteredParticipations = computed(() => {
    const list = this.participationsByPhase();
    const q = this.searchQuery().trim().toLowerCase();
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
    return new Map(phases.map((ph) => [ph.id, list.filter((p) => p.phases?.some((x) => x.id === ph.id)).length]));
  });

  constructor() {
    effect(() => {
      const proj = this.project();
      if (proj?.id) {
        this.projectsStore.loadParticipations(proj.id);
        this.phasesStore.loadAll(proj.id);
      }
    });

    effect(() => {
      this.sortedPhases.set(this.phasesStore.sortedPhases());
    });

    effect(() => {
      this.searchQuery();
      this.selectedPhase();
      this.currentPage.set(1);
    });
  }

  readonly getParticipationKey = getParticipationKey;

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
    const filteredIds = new Set(this.filteredParticipations().map(getParticipationKey));
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (this.isAllFilteredSelected()) {
        for (const id of filteredIds) next.delete(id);
      } else {
        for (const id of filteredIds) next.add(id);
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  isSelected(p: IProjectParticipation): boolean {
    return this.selectedIds().has(getParticipationKey(p));
  }

  toggleDetail(p: IProjectParticipation): void {
    const key = getParticipationKey(p);
    this.expandedParticipationKey.update((current) => (current === key ? null : key));
  }

  isDetailExpanded(p: IProjectParticipation): boolean {
    return this.expandedParticipationKey() === getParticipationKey(p);
  }

  moveToPhase(): void {
    this.executePhaseOperation(this.moveTargetPhase(), 'move');
  }

  removeFromPhase(): void {
    this.executePhaseOperation(this.removeTargetPhase(), 'remove');
  }

  private executePhaseOperation(phaseId: string | null, operation: 'move' | 'remove'): void {
    const ids = this.getParticipationsIds();
    const proj = this.project();
    if (!phaseId || ids.length === 0 || !proj?.slug) return;

    const handler = operation === 'move' ? this.projectsStore.moveParticipations : this.projectsStore.removeParticipations;
    const targetSignal = operation === 'move' ? this.moveTargetPhase : this.removeTargetPhase;

    handler.call(this.projectsStore, {
      dto: { ids, phaseId },
      onSuccess: () => {
        this.projectsStore.loadOne(proj.slug);
        if (proj.id) this.projectsStore.loadParticipations(proj.id);
        this.clearSelection();
        targetSignal.set(null);
      }
    });
  }

  private getParticipationsIds(): string[] {
    const selectedKeys = this.selectedIds();
    return this.rawParticipations()
      .filter((p) => selectedKeys.has(getParticipationKey(p)))
      .map((p) => p.id);
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
