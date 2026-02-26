export interface IGeneralStats {
  totalUsers: number;
  totalProjects: number;
  totalEvents: number;
  totalVentures: number;
}

export interface IParticipationItem {
  id: string;
  name: string;
  participations: number;
}

export interface ISubprogramParticipations {
  id: string;
  name: string;
  participations: number;
  projects: IParticipationItem[];
  events: IParticipationItem[];
}

export interface IProgramParticipations {
  id: string;
  name: string;
  participations: number;
  subprograms: ISubprogramParticipations[];
}

export interface IStatsSummary {
  totalProjectParticipations: number;
  totalEventParticipations: number;
  totalParticipations: number;
}

export interface IStatsByYear {
  year: number;
  summary: IStatsSummary;
  detailedParticipations: {
    programs: IProgramParticipations[];
  };
}
