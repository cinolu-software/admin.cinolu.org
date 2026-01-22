import { IAttachment } from './attachment.model';
import { IBase } from './base.model';
import { ITag } from './tag.model';
import { IUser } from './user.model';

export interface IOpportunity extends IBase {
  title: string;
  slug: string;
  description: string;
  link: string;
  started_at: Date;
  ended_at: Date;
  tags: ITag[];
  creator: IUser;
  attachments: IAttachment[];
}
