import { Component, effect, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChartColumn, SquarePen, Images, Star, Eye } from 'lucide-angular';
import { UiTabs, MetricsTableComponent } from '@shared/ui';
import { MetricsMap, totalMetrics, achievementRate, metricsMap, metricsMapToDto } from '@shared/helpers';
import { IEvent } from '@shared/models';
import { IndicatorsStore } from '@features/programs/store/indicators.store';
import { EventsStore } from '../../store/events.store';
import { EventSheet } from '../../components/event-sheet/event-sheet';
import { EventGalleryComponent } from '../../components/event-gallery/event-gallery';
import { EventUpdate } from '../../components/event-update/event-update';
import { EventDetailsSkeleton } from '../../ui/event-details-skeleton/event-details-skeleton';
import { GalleryStore } from '../../store/event-gallery.store';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.html',
  providers: [EventsStore, IndicatorsStore, GalleryStore],
  imports: [
    UiTabs,
    MetricsTableComponent,
    EventSheet,
    EventGalleryComponent,
    EventUpdate,
    EventDetailsSkeleton,
    LucideAngularModule
  ]
})
export class EventDetails implements OnInit {
  #route = inject(ActivatedRoute);
  #slug = this.#route.snapshot.params['slug'];
  eventsStore = inject(EventsStore);
  galleryStore = inject(GalleryStore);
  indicatorsStore = inject(IndicatorsStore);
  metricsMap: MetricsMap = {};
  activeTab = signal('details');
  tabs = [
    { label: "Fiche d'activité", name: 'details', icon: ChartColumn },
    { label: 'Mettre à jour', name: 'edit', icon: SquarePen },
    { label: 'Gérer la galerie', name: 'gallery', icon: Images },
    { label: 'Les indicateurs', name: 'indicators', icon: ChartColumn }
  ];
  totalTargeted = computed(() => totalMetrics(this.metricsMap, 'target'));
  totalAchieved = computed(() => totalMetrics(this.metricsMap, 'achieved'));
  achievementPercentage = computed(() => achievementRate(this.totalTargeted(), this.totalAchieved()));

  constructor() {
    this.#watchEventChanges();
  }

  ngOnInit(): void {
    this.eventsStore.loadOne(this.#slug);
    this.galleryStore.loadAll(this.#slug);
  }

  #watchEventChanges(): void {
    effect(() => {
      const event = this.eventsStore.event();
      if (!event) return;
      this.#initMetrics(event);
    });
  }

  #initMetrics(event: IEvent): void {
    const indicators = this.indicatorsStore.indicators();
    this.metricsMap = metricsMap(indicators, event.metrics);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }

  onDeleteImage(imageId: string): void {
    this.galleryStore.delete(imageId);
  }

  onCoverUploaded(): void {
    this.eventsStore.loadOne(this.#slug);
  }

  onGalleryUploaded(): void {
    this.galleryStore.loadAll(this.#slug);
  }

  onSaveMetrics(): void {
    const event = this.eventsStore.event();
    if (!event) return;
    const indicators = this.indicatorsStore.indicators();
    const metrics = metricsMapToDto(this.metricsMap, indicators);
    this.eventsStore.createMetrics({ id: event.id, metrics });
  }

  onShowcase(): void {
    const event = this.eventsStore.event();
    if (!event) return;
    this.eventsStore.showcase(event.id);
  }

  onPublish(): void {
    const event = this.eventsStore.event();
    if (!event) return;
    this.eventsStore.publish(event.id);
  }

  icons = { Star, Eye };
}
