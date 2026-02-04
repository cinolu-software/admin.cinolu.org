import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import type { IPhase } from '@shared/models';
import { ActivatedRoute, Router } from '@angular/router';
import { SquarePen, Images, ChartColumn, Star, Eye, Layers, Users, LucideAngularModule } from 'lucide-angular';
import { UiTabs } from '@shared/ui';
import { GalleryStore } from '../../store/project-gallery.store';
import { PhasesStore } from '../../store/phases.store';
import { ProjectsStore } from '../../store/projects.store';
import { ProjectSheet } from '../../components/project-sheet/project-sheet';
import { ProjectGallery } from '../../components/project-gallery/project-gallery';
import { ProjectUpdate } from '../../components/project-update/project-update';
import { Phases } from '../../components/phases/phases';
import { ProjectDetailsSkeleton } from '../../ui/project-details-skeleton/project-details-skeleton';
import { Participants } from '@features/projects/components/participants/participants';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GalleryStore, PhasesStore, ProjectsStore],
  imports: [
    UiTabs,
    ProjectSheet,
    ProjectGallery,
    ProjectUpdate,
    Phases,
    Participants,
    ProjectDetailsSkeleton,
    LucideAngularModule
  ]
})
export class ProjectDetails implements OnInit {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #slug = this.#route.snapshot.params['slug'];
  projectStore = inject(ProjectsStore);
  galleryStore = inject(GalleryStore);
  activeTab = signal(this.#route.snapshot.queryParamMap.get('tab') || 'details');
  tabs = [
    { label: "Fiche d'activité", name: 'details', icon: ChartColumn },
    { label: 'Phases', name: 'phases', icon: Layers },
    { label: 'Participants', name: 'participants', icon: Users },
    { label: 'Mettre à jour', name: 'edit', icon: SquarePen },
    { label: 'Galerie', name: 'gallery', icon: Images }
  ];

  ngOnInit(): void {
    this.projectStore.loadOne(this.#slug);
    this.galleryStore.loadAll(this.#slug);
  }

  onCoverUploaded(): void {
    this.projectStore.loadOne(this.#slug);
  }

  onGalleryUploaded(): void {
    this.galleryStore.loadAll(this.#slug);
  }

  onDeleteImage(id: string): void {
    this.galleryStore.delete(id);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    this.#router.navigate([], { queryParams: { tab } });
  }

  onPhasesChange(phases: IPhase[]): void {
    this.projectStore.setProjectPhases(phases);
  }

  onShowcase(): void {
    const project = this.projectStore.project();
    if (!project) return;
    this.projectStore.showcase(project.id);
  }

  onPublish(): void {
    const project = this.projectStore.project();
    if (!project) return;
    this.projectStore.publish(project.id);
  }

  icons = { Star, Eye, Users };
}
