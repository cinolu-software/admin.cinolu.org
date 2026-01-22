import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OpportunitiesStore } from '../../store/opportunities.store';
import { OpportunityTagsStore } from '../../store/opportunity-tags.store';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiTextarea, UiTabs } from '@shared/ui';
import { LucideAngularModule, SquarePen, Paperclip, Trash2, FileExclamationPoint } from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiConfirmDialog } from '@shared/ui';
import { IOpportunity, ITag } from '@shared/models';

@Component({
  selector: 'app-opportunity-details',
  templateUrl: './opportunity-details.html',
  providers: [OpportunitiesStore, OpportunityTagsStore],
  imports: [
    ReactiveFormsModule,
    UiButton,
    UiInput,
    UiTextarea,
    UiDatepicker,
    UiMultiSelect,
    UiTabs,
    LucideAngularModule,
    DatePipe,
    UiConfirmDialog
  ]
})
export class OpportunityDetails implements OnInit {
  #route = inject(ActivatedRoute);
  #fb = inject(FormBuilder);
  #confirmationService = inject(ConfirmationService);
  store = inject(OpportunitiesStore);
  tagsStore = inject(OpportunityTagsStore);
  form: FormGroup = this.#initForm();
  activeTab = signal('edit');
  icons = { SquarePen, Paperclip, Trash2, FileExclamationPoint };
  tabs = [
    { label: "Mettre à jour l'opportunité", name: 'edit', icon: SquarePen },
    { label: 'Gérer les annexes', name: 'attachments', icon: Paperclip }
  ];

  constructor() {
    this.tagsStore.loadUnpaginated();
    effect(() => {
      const opportunity = this.store.opportunity();
      if (opportunity) {
        this.#patchForm(opportunity);
      }
    });
  }

  ngOnInit(): void {
    const slug = this.#route.snapshot.paramMap.get('slug');
    if (!slug) return;
    this.store.loadOne(slug);
  }

  #initForm(): FormGroup {
    return this.#fb.group({
      id: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      link: ['', Validators.required],
      started_at: [null, Validators.required],
      ended_at: [null, Validators.required],
      tags: [[], Validators.required]
    });
  }

  #patchForm(opportunity: IOpportunity): void {
    this.form.patchValue({
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      link: opportunity.link,
      started_at: new Date(opportunity.started_at),
      ended_at: new Date(opportunity.ended_at),
      tags: opportunity.tags?.map((t: ITag) => t.id) || []
    });
  }

  onUpdate(): void {
    if (!this.form.valid) return;
    this.store.update(this.form.value);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const opportunity = this.store.opportunity();
    if (!opportunity) return;
    this.store.addAttachment({ id: opportunity.id, file });
    input.value = '';
  }

  onDeleteAttachment(attachmentId: string): void {
    this.#confirmationService.confirm({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cette annexe ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        const opportunity = this.store.opportunity();
        if (!opportunity) return;
        this.store.deleteAttachment({ id: opportunity.id, attachmentId });
      }
    });
  }
}
