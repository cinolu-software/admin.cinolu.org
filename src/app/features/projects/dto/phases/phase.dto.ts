import { IDeliverable } from '@shared/models/delivrable.model';

export interface PhaseDto {
  id?: string;
  name: string;
  description: string;
  started_at: Date;
  ended_at: Date;
  deliverables: IDeliverable[];
}
