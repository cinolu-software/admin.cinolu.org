import { IPhase, IProject } from '@shared/models';

export function buildImpactReportTemplate(project: IProject): string {
  const phases = project.phases ?? [];
  const projectDuration = project.duration_hours ? `${project.duration_hours} heures` : 'Non renseignée';
  const mentorsSummary = collectMentorsSummary(phases);
  const resultsObservedList = buildResultsObservedList(phases);
  return `
      <h2>Rapport ${project.name}</h2>
      <p><strong>Période couverte:</strong> ${project.started_at} - ${project.ended_at}</p>
      <h3>0. Informations projet</h3>
      <ul>
        <li><strong>Description:</strong> ${project.description}</li>
        <li><strong>Durée estimée:</strong> ${projectDuration}</li>
        <li><strong>Mentors impliqués:</strong> ${mentorsSummary}</li>
      </ul>
      <h3>1. Résultats observés</h3>
      <ul>${resultsObservedList}</ul>
    `;
}

function buildResultsObservedList(phases: IPhase[]): string {
  if (!phases.length) return '<li>Aucune phase disponible pour calculer les participations.</li>';
  const phaseItems = phases.map((phase) => {
    return `
        <li>
          <strong>${phase.name}</strong>: ${phase.participationsCount} participants
        </li>`;
  });
  const totalParticipations = phases.reduce((total, phase) => total + (phase.participationsCount || 0), 0);
  phaseItems.push(`<li><strong>Total participations (toutes phases):</strong> ${totalParticipations}</li>`);
  return phaseItems.join('');
}

function collectMentorsSummary(phases: IPhase[]): string {
  const mentorNames = new Set<string>();
  phases.forEach((phase) => {
    const mentors = phase.mentors || [];
    mentors.forEach((mentor) => {
      const owner = mentor.owner;
      if (owner?.name) mentorNames.add(owner.name);
    });
  });
  if (!mentorNames.size) return 'Aucun mentor assigné';
  return [...mentorNames].map((name) => name).join(', ');
}
