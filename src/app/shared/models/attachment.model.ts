import { IBase } from './base.model';
import { IOpportunity } from './opportunity.model';

export interface IAttachment extends IBase {
  filename: string;
  opportunity: IOpportunity;
}
