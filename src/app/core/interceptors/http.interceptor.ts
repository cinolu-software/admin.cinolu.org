import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '@env/environment';
import { LoadingService } from '@shared/services/loading/loading.service';
import { inject } from '@angular/core';

export const httpInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const loadingService = inject(LoadingService);
  loadingService.show();
  const newReq: HttpRequest<unknown> = req.clone({
    url: environment.apiUrl + req.url,
    withCredentials: true
  });
  return next(newReq).pipe(finalize(() => loadingService.hide()));
};
