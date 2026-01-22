import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OpportunitiesStore } from '../../store/opportunities.store';
import { OpportunityTagsStore } from '../../store/opportunity-tags.store';
import { UiButton, UiDatepicker, UiInput, UiMultiSelect, UiTextarea } from '@shared/ui';

@Component({
  selector: 'app-add-opportunity',
  templateUrl: './add-opportunity.html',
  providers: [OpportunitiesStore, OpportunityTagsStore],
  imports: [UiInput, UiMultiSelect, UiButton, UiDatepicker, UiTextarea, ReactiveFormsModule]
})
export class AddOpportunity {
  #fb = inject(FormBuilder);
  form: FormGroup = this.#initForm();
  store = inject(OpportunitiesStore);
  tagsStore = inject(OpportunityTagsStore);

  constructor() {
    this.tagsStore.loadUnpaginated();
  }

  #initForm(): FormGroup {
    return this.#fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      link: ['', Validators.required],
      started_at: [null, Validators.required],
      ended_at: [null, Validators.required],
      tags: [[], Validators.required]
    });
  }

  onAddOpportunity(): void {
    if (!this.form.valid) return;
    this.store.create(this.form.value);
  }
}
