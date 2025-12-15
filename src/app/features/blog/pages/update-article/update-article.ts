import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Images, SquarePen } from 'lucide-angular';
import { UiTabs } from '@shared/ui';
import { ArticlesStore } from '../../store/articles.store';
import { ArticleEditFormComponent } from '../../components/article-edit-form/article-edit-form';
import { ArticleGalleryComponent } from '../../components/article-gallery/article-gallery';

@Component({
  selector: 'app-update-article',
  providers: [ArticlesStore],
  imports: [CommonModule, UiTabs, ArticleEditFormComponent, ArticleGalleryComponent],
  templateUrl: './update-article.html'
})
export class UpdateArticle implements OnInit {
  #route = inject(ActivatedRoute);
  #slug = this.#route.snapshot.params['slug'];
  store = inject(ArticlesStore);
  activeTab = signal('edit');
  tabs = [
    { label: "Mettre à jour l'article", name: 'edit', icon: SquarePen },
    { label: 'Gérer la galerie', name: 'gallery', icon: Images }
  ];

  ngOnInit(): void {
    this.store.loadOne(this.#slug);
    this.store.loadGallery(this.#slug);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }

  onGalleryUploaded(): void {
    this.store.loadGallery(this.#slug);
  }

  onCoverUploaded(): void {
    this.store.loadOne(this.#slug);
  }

  onDeleteImage(imgId: string): void {
    this.store.deleteImage(imgId);
  }
}
