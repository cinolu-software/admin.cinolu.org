import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { IArticle, IImage } from '@shared/models';
import { LucideAngularModule, Trash2, Image } from 'lucide-angular';
import { FileUpload } from '@shared/ui';
import { ApiImgPipe } from '@shared/pipes';

@Component({
  selector: 'app-article-gallery',
  templateUrl: './article-gallery.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgOptimizedImage, LucideAngularModule, FileUpload, ApiImgPipe]
})
export class ArticleGalleryComponent {
  article = input.required<IArticle>();
  gallery = input.required<IImage[]>();
  isLoading = input<boolean>(false);
  coverUploaded = output<void>();
  galleryUploaded = output<void>();
  deleteImage = output<string>();
  icons = { Trash2, Image };

  onCoverUploaded(): void {
    this.coverUploaded.emit();
  }

  onGalleryUploaded(): void {
    this.galleryUploaded.emit();
  }

  onDeleteImage(imageId: string): void {
    this.deleteImage.emit(imageId);
  }
}
