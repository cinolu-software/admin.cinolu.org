import { NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { IEvent, IImage } from '@shared/models';
import { Image, LucideAngularModule, Trash } from 'lucide-angular';
import { FileUpload } from '@shared/ui';
import { ApiImgPipe } from '@shared/pipes';

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
  icons = { Image, Trash };

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
