import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProgramsStore } from '../../store/programs.store';
import { ProgramCategoriesStore } from '../../store/program-categories.store';
import { SquarePen, Trash2, Funnel, Tag, Star, Eye } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { UiTabs, FileUpload, UiInput } from '@shared/ui';
import { IProgram } from '@shared/models';
import { ListSubprograms } from '../../components/subprograms/subprograms';
import { UiButton, UiSelect, UiTextarea } from '@shared/ui';

@Component({
  selector: 'app-update-program',
  providers: [ProgramsStore, ProgramCategoriesStore],
  imports: [
    UiTabs,
    ReactiveFormsModule,
    UiButton,
    FormsModule,
    UiSelect,
    FileUpload,
    LucideAngularModule,
    ListSubprograms,
    UiTextarea,
    UiInput
  ],
  templateUrl: './update-program.html'
})
export class UpdateProgram implements OnInit {
  #route = inject(ActivatedRoute);
  #fb = inject(FormBuilder);
  store = inject(ProgramsStore);
  categoriesStore = inject(ProgramCategoriesStore);
  activeTab = signal('edit');
  icons = { Trash2, Funnel, Tag, Star, Eye };
  tabs = [
    { label: 'Modifier le programme', name: 'edit', icon: SquarePen },
    { label: 'Sous programmes', name: 'subprograms', icon: Tag }
  ];
  updateForm: FormGroup = this.#fb.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    description: ['', Validators.required],
    category: ['', Validators.required]
  });
  slug = this.#route.snapshot.params['slug'];

  constructor() {
    effect(() => {
      const program = this.store.program();
      if (program) this.#patchForm(program);
    });
  }

  ngOnInit(): void {
    if (this.slug) this.store.loadOne(this.slug);
    this.categoriesStore.loadUnpaginated();
  }

  #patchForm(program: IProgram | null): void {
    if (!program) return;
    this.updateForm.patchValue({ ...program, category: program.category?.id });
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }

  onSubmit(): void {
    const program = this.store.program();
    if (this.updateForm.invalid || !program) return;
    this.store.update({
      programId: program.id,
      payload: this.updateForm.value
    });
  }

  onShowcase(): void {
    const program = this.store.program();
    if (program) this.store.highlight(program.id);
  }

  onPublish(): void {
    const program = this.store.program();
    if (program) this.store.publishProgram(program.id);
  }
}
