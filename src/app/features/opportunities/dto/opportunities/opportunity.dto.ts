export interface OpportunityDto {
  id?: string;
  title: string;
  description: string;
  link: string;
  started_at: Date;
  ended_at: Date;
  tags: string[];
}
