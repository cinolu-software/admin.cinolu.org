import { IBase } from './base.model';
import { IPhase } from './phase.model';

export interface IDeliverable extends IBase {
  title: string;
  description: string;
  phase: IPhase;
}
