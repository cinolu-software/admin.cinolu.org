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
import { LucideAngularModule, Users, Search, CircleArrowRight, X, Check, Upload, Eye, Trash2 } from 'lucide-angular';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar, UiBadge, UiButton, UiPagination, UiSelect } from '@shared/ui';
import { IPhase, IProject, IProjectParticipation } from '@shared/models';
import { PhasesStore } from '@features/projects/store/phases.store';
import { ProjectsStore } from '@features/projects/store/projects.store';
import { ParticipationDetail } from './participation-detail/participation-detail';

const PAGE_SIZE = 20;
const OPERATION_MOVE = 'move';
const OPERATION_REMOVE = 'remove';

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
  phasesStore = inject(PhasesStore);
  projectsStore = inject(ProjectsStore);
  selectedPhase = signal<string | null>(null);
  searchQuery = signal('');
  currentPage = signal(1);
  selectedIds = signal<Set<string>>(new Set());
  selectedParticipationForDetail = signal<IProjectParticipation | null>(null);
  operationType = signal(OPERATION_MOVE);
  moveTargetPhase = signal<string | null>(null);
  removeTargetPhase = signal<string | null>(null);
  selectedCsvFile = signal<File | null>(null);
  csvFileInput = viewChild<ElementRef<HTMLInputElement>>('csvFileInput');
  sortedPhases = signal<IPhase[]>([]);
  icons = { Users, Search, CircleArrowRight, X, Check, Upload, Eye, Trash2 };
  pageSize = PAGE_SIZE;
  operationMove = OPERATION_MOVE;
  operationRemove = OPERATION_REMOVE;
  operationTypeOptions = [
    { label: 'Déplacer', value: OPERATION_MOVE },
    { label: 'Retirer', value: OPERATION_REMOVE }
  ];
  movePhaseOptions = computed(() => this.sortedPhases().map((p) => ({ label: p.name, value: p.id })));
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
    return list.filter((p) => p.phase?.some((ph) => ph.id === phaseId) ?? false);
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
    return new Map(phases.map((ph) => [ph.id, list.filter((p) => p.phase?.some((x) => x.id === ph.id)).length]));
  });

  constructor() {
    effect(() => {
      const proj = this.project();
      if (proj?.id) this.projectsStore.loadParticipations(proj.id);
      if (proj?.id) this.phasesStore.loadAll(proj.id);
    });

    effect(() => {
      this.sortedPhases.set(this.phasesStore.sortedPhases());
    });

    effect(() => {
      this.searchQuery();
      this.selectedPhase();
      this.currentPage.set(1);
      this.clearSelection();
    });
  }

  participationKey(p: IProjectParticipation): string {
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

  isSelected(p: IProjectParticipation): boolean {
    return this.selectedIds().has(getParticipationKey(p));
  }

  openDetail(p: IProjectParticipation): void {
    this.selectedParticipationForDetail.set(p);
  }

  closeDetail(): void {
    this.selectedParticipationForDetail.set(null);
  }

  moveToPhase(): void {
    const phaseId = this.moveTargetPhase();
    const ids = this.getParticipationsIds();
    const proj = this.project();
    if (!phaseId || ids.length === 0 || !proj?.slug) return;
    this.phasesStore.moveParticipations({
      dto: { ids, phaseId },
      onSuccess: () => {
        this.projectsStore.loadOne(proj.slug);
        if (proj.id) this.projectsStore.loadParticipations(proj.id);
        this.clearSelection();
        this.moveTargetPhase.set(null);
      }
    });
  }

  removeFromPhase(): void {
    const phaseId = this.removeTargetPhase();
    const ids = this.getParticipationsIds();
    const proj = this.project();
    if (!phaseId || ids.length === 0 || !proj?.slug) return;
    this.phasesStore.removeParticipations({
      dto: { ids, phaseId },
      onSuccess: () => {
        this.projectsStore.loadOne(proj.slug);
        if (proj.id) this.projectsStore.loadParticipations(proj.id);
        this.clearSelection();
        this.removeTargetPhase.set(null);
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
