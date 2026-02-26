import { IProjectParticipation } from '@shared/models';

export function getParticipationKey(p: IProjectParticipation): string {
  return `${p.user.id}-${p.venture?.id ?? 'none'}`;
}
