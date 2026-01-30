import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SquarePen, Images, ChartColumn, Star, Eye, LucideAngularModule } from 'lucide-angular';
import { UiTabs } from '@shared/ui';
import { GalleryStore } from '../../store/project-gallery.store';
import { ProjectsStore } from '../../store/projects.store';
import { ProjectSheet } from '../../components/project-sheet/project-sheet';
import { ProjectGallery } from '../../components/project-gallery/project-gallery';
import { ProjectUpdate } from '../../components/project-update/project-update-form';
import { ProjectDetailsSkeleton } from '../../ui/project-details-skeleton/project-details-skeleton';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GalleryStore, ProjectsStore],
  imports: [UiTabs, ProjectSheet, ProjectGallery, ProjectUpdate, ProjectDetailsSkeleton, LucideAngularModule]
})
export class ProjectDetails implements OnInit {
  #route = inject(ActivatedRoute);
  #slug = this.#route.snapshot.params['slug'];
  projectStore = inject(ProjectsStore);
  galleryStore = inject(GalleryStore);
  activeTab = signal('details');
  tabs = [
    { label: "Fiche d'activité", name: 'details', icon: ChartColumn },
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

  icons = { Star, Eye };
}
