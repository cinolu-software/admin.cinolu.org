export interface PhaseDeliverableDto {
  title: string;
  description?: string;
}

export interface PhaseDto {
  id?: string;
  name: string;
  description: string;
  started_at: Date;
  ended_at: Date;
  deliverables?: PhaseDeliverableDto[];
}
