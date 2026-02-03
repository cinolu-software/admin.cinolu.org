import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Users, Layers, Calendar } from 'lucide-angular';
import { startWith } from 'rxjs';
import { GroupedParticipantsStore } from '../../store/grouped-participants.store';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar, UiBadge, UiSelect } from '@shared/ui';
import { parseDate } from '@shared/helpers/form.helper';

const UNASSIGNED_VALUE = '__unassigned__';

@Component({
  selector: 'app-participants',
  templateUrl: './participants.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GroupedParticipantsStore],
  imports: [DatePipe, ReactiveFormsModule, LucideAngularModule, ApiImgPipe, UiAvatar, UiBadge, UiSelect]
})
export class Participants implements OnInit {
  projectId = input.required<string>();
  store = inject(GroupedParticipantsStore);
  form = new FormGroup({
    phase: new FormControl<string | null>(null)
  });
  icons = { Users, Layers, Calendar };
  sortedPhases = computed(() => {
    const data = this.store.data();
    if (!data?.phases?.length) return [];
    return [...data.phases].sort(
      (a, b) => parseDate(a.phase.started_at).getTime() - parseDate(b.phase.started_at).getTime()
    );
  });
  phaseOptions = computed(() => {
    const sorted = this.sortedPhases();
    const data = this.store.data();
    const options: { label: string; value: string }[] = sorted.map((g) => ({
      label: g.phase.name,
      value: g.phase.id
    }));
    if (data && data.unassigned.length > 0) {
      options.push({
        label: `Non assignés`,
        value: UNASSIGNED_VALUE
      });
    }
    return options;
  });
  phaseValue = toSignal(
    (this.form.get('phase') as FormControl<string | null>).valueChanges.pipe(
      startWith((this.form.get('phase') as FormControl<string | null>).value)
    ),
    { initialValue: null as string | null }
  );
  selectedGroup = computed(() => {
    const value = this.phaseValue();
    const data = this.store.data();
    if (!value || !data) return null;
    if (value === UNASSIGNED_VALUE) {
      return { phase: null, participants: data.unassigned };
    }
    const group = data.phases.find((g) => g.phase.id === value);
    return group ? { phase: group.phase, participants: group.participants } : null;
  });
  currentPhase = computed(() => {
    return this.selectedGroup()?.phase || this.sortedPhases()[0]?.phase || null;
  });
  currentParticipants = computed(() => this.selectedGroup()?.participants ?? []);

  constructor() {
    effect(() => {
      const options = this.phaseOptions();
      const current = this.form.get('phase')?.value;
      if (options.length > 0 && (!current || !options.some((o) => o.value === current))) {
        this.form.patchValue({ phase: options[0].value }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.store.load(this.projectId());
  }
}
