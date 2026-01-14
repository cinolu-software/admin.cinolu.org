import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'programs/update/:slug',
    renderMode: RenderMode.Client
  },
  {
    path: 'blog/articles/update/:slug',
    renderMode: RenderMode.Client
  },
  {
    path: 'events/update/:slug',
    renderMode: RenderMode.Client
  },
  {
    path: 'mentor-profiles/view/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'ventures/view/:slug',
    renderMode: RenderMode.Client
  },
  {
    path: 'projects/update/:slug',
    renderMode: RenderMode.Client
  },
  {
    path: 'users/update/:email',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
