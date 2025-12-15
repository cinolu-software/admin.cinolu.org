import { NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { IEvent, IImage } from '@shared/models';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import { FileUpload } from '@shared/ui';
import { ApiImgPipe } from '@shared/pipes';
import { environment } from '@env/environment';

@Component({
  selector: 'app-event-gallery',
  templateUrl: './event-gallery.html',
  imports: [NgOptimizedImage, LucideAngularModule, FileUpload, ApiImgPipe]
})
export class EventGalleryComponent {
  event = input.required<IEvent>();
  gallery = input.required<IImage[]>();
  isLoading = input<boolean>(false);
  coverUploaded = output<void>();
  galleryUploaded = output<void>();
  deleteImage = output<string>();
  url = `${environment.apiUrl}events/cover/`;
  galleryUrl = `${environment.apiUrl}events/gallery/`;
  icons = {
    trash: Trash2
  };

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
