import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GENDERS } from '@shared/data';
import { markAllAsTouched, parseDate } from '@shared/helpers';
import { IExpertise } from '@shared/models';
import { UiButton, UiCheckbox, UiDatepicker, UiInput, UiMultiSelect, UiSelect, UiTextarea } from '@shared/ui';
import { MentorsStore } from '../../store/mentors.store';
import { ExpertisesStore } from '../../store/expertises.store';
import {
  CreateExperienceDto,
  CreateMentorDto,
  CreateUserDto,
  MentorRequestDto
} from '../../dto/mentors/create-mentor.dto';

@Component({
  selector: 'app-update-mentor',
  templateUrl: './update-mentor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MentorsStore, ExpertisesStore],
  imports: [UiInput, UiTextarea, UiDatepicker, UiSelect, UiMultiSelect, UiCheckbox, UiButton, ReactiveFormsModule]
})
export class UpdateMentor implements OnInit {
  #route = inject(ActivatedRoute);
  #fb = inject(FormBuilder);
  #mentorId = this.#route.snapshot.params['id'];
  store = inject(MentorsStore);
  expertisesStore = inject(ExpertisesStore);
  genders = GENDERS;
  form = this.#initForm();

  constructor() {
    effect(() => {
      const mentor = this.store.mentor();
      if (!mentor) return;
      this.form.patchValue({
        email: mentor.owner.email,
        name: mentor.owner.name,
        phone_number: mentor.owner.phone_number,
        gender: mentor.owner.gender,
        city: mentor.owner.city,
        birth_date: parseDate(mentor.owner.birth_date),
        country: mentor.owner.country,
        biography: mentor.owner.biography,
        years_experience: mentor.years_experience,
        expertises: mentor.expertises.map((expertise) => expertise.id),
        type: mentor.type ?? ''
      });
      this.#patchExperiences(mentor.experiences);
    });
  }

  ngOnInit(): void {
    this.store.loadOne(this.#mentorId);
    this.expertisesStore.loadUnpaginated();
  }

  get experiences(): FormArray<FormGroup> {
    return this.form.get('experiences') as FormArray<FormGroup>;
  }

  addExperience(): void {
    this.experiences.push(this.#buildExperienceForm());
  }

  removeExperience(index: number): void {
    if (this.experiences.length <= 1) {
      return;
    }
    this.experiences.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      markAllAsTouched(this.form);
      return;
    }
    this.store.patch({ id: this.#mentorId, dto: this.#buildPayload() });
  }

  onCreateExpertise(name: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const existingExpertise = this.expertisesStore
      .allExpertises()
      .find((expertise) => expertise.name.trim().toLowerCase() === trimmedName.toLowerCase());

    if (existingExpertise) {
      const currentValue = ((this.form.get('expertises')?.value as string[] | null) ?? []).filter(Boolean);
      if (!currentValue.includes(existingExpertise.id)) {
        this.form.patchValue({ expertises: [...currentValue, existingExpertise.id] });
      }
      return;
    }

    this.expertisesStore.create({
      payload: { name: trimmedName },
      onSuccess: (expertise: IExpertise) => {
        const currentValue = ((this.form.get('expertises')?.value as string[] | null) ?? []).filter(Boolean);
        if (!currentValue.includes(expertise.id)) {
          this.form.patchValue({ expertises: [...currentValue, expertise.id] });
        }
      }
    });
  }

  #patchExperiences(experiences: CreateExperienceDto[]): void {
    this.experiences.clear();

    if (experiences.length === 0) {
      this.experiences.push(this.#buildExperienceForm());
      return;
    }

    for (const experience of experiences) {
      this.experiences.push(
        this.#buildExperienceForm({
          ...experience,
          start_date: parseDate(String(experience.start_date)),
          end_date: experience.end_date ? parseDate(String(experience.end_date)) : undefined
        })
      );
    }
  }

  #initForm(): FormGroup {
    return this.#fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      phone_number: [''],
      gender: [''],
      city: [''],
      birth_date: [''],
      country: [''],
      biography: [''],
      google_image: [''],
      years_experience: [0, [Validators.required, Validators.min(0)]],
      expertises: [[], Validators.required],
      type: [''],
      experiences: this.#fb.array([this.#buildExperienceForm()])
    });
  }

  #buildExperienceForm(experience?: Partial<CreateExperienceDto>): FormGroup {
    return this.#fb.group({
      id: [experience?.id ?? ''],
      company_name: [experience?.company_name ?? '', Validators.required],
      job_title: [experience?.job_title ?? '', Validators.required],
      is_current: [experience?.is_current ?? false],
      start_date: [experience?.start_date ?? new Date(), Validators.required],
      end_date: [experience?.end_date ?? null]
    });
  }

  #buildPayload(): CreateMentorDto {
    const value = this.form.value;

    const user: CreateUserDto = {
      email: String(value['email']),
      name: String(value['name']),
      phone_number: this.#toOptionalString(value['phone_number']),
      gender: this.#toOptionalString(value['gender']),
      city: this.#toOptionalString(value['city']),
      birth_date: this.#toOptionalDate(value['birth_date']),
      country: this.#toOptionalString(value['country']),
      biography: this.#toOptionalString(value['biography']),
      google_image: this.#toOptionalString(value['google_image'])
    };

    const experiences = this.experiences.controls.map((control) => {
      const row = control.value;
      const isCurrent = Boolean(row['is_current']);
      const startDate = this.#toOptionalDate(row['start_date']);

      return {
        id: this.#toOptionalString(row['id']),
        company_name: String(row['company_name']),
        job_title: String(row['job_title']),
        is_current: isCurrent,
        start_date: startDate ?? new Date(),
        end_date: isCurrent ? undefined : this.#toOptionalDate(row['end_date'])
      } satisfies CreateExperienceDto;
    });

    const mentor: MentorRequestDto = {
      years_experience: Number(value['years_experience']),
      expertises: (value['expertises'] as string[]) ?? [],
      type: this.#toOptionalString(value['type']),
      experiences
    };

    return { user, mentor };
  }

  #toOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : undefined;
  }

  #toOptionalDate(value: unknown): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
}
