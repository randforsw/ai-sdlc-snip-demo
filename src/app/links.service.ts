import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Link {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

// Empty string = same origin; works locally (ng serve proxies to :3000 aren't
// needed because the Bun server also serves the built frontend) and on Railway.
const API = '';

@Injectable({ providedIn: 'root' })
export class LinksService {
  private http = inject(HttpClient);

  create(url: string): Observable<Link> {
    return this.http.post<Link>(`${API}/api/links`, { url });
  }

  getAll(): Observable<Link[]> {
    return this.http.get<Link[]>(`${API}/api/links`);
  }
}
