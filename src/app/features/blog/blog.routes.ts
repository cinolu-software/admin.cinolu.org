import { Routes } from '@angular/router';

export const blogRoutes: Routes = [
  {
    path: 'articles',
    children: [
      {
        path: '',
        title: 'Liste des articles',
        loadComponent: () => import('./pages/list-articles/list-articles').then((c) => c.ListArticles)
      },
      {
        path: 'add',
        title: 'Inserer un article',
        loadComponent: () => import('./pages/add-article/add-article').then((c) => c.AddArticle)
      },
      {
        path: 'update/:slug',
        title: 'Modifier un article',
        loadComponent: () => import('./pages/article-details/article-details').then((c) => c.ArticleDetails)
      }
    ]
  },
  {
    path: 'tags',
    title: 'Tags des articles',
    loadComponent: () => import('./pages/article-tags/article-tags').then((c) => c.ArticleTags)
  }
];
