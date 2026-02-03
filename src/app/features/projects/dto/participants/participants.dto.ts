import type { IPhase } from '@shared/models';
import type { IUser } from '@shared/models';

export interface ParticipantsGroupedByPhaseDto {
  phases: { phase: IPhase; participants: IUser[] }[];
  unassigned: IUser[];
}
