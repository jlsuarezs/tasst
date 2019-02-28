import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';

const routes: Routes = [
    {
      path: '',
      component: HomeComponent
    },
    {
      path: 'index.html',
      component: HomeComponent
    },
    {
      path: '**',
      component: PageNotFoundComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { useHash: false })
    ],
    exports: [
        RouterModule
    ],
    declarations: []
})
export class AppRoutingModule {}
