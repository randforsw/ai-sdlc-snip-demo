import { Component, inject, signal, OnInit } from '@angular/core';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private svc = inject(LinksService);

  urlInput = signal('');
  submitting = signal(false);
  error = signal('');
  newLink = signal<Link | null>(null);
  links = signal<Link[]>([]);

  ngOnInit(): void {
    this.loadLinks();
  }

  private isValidUrl(value: string): boolean {
    try {
      const { protocol } = new URL(value);
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }

  private loadLinks(): void {
    this.svc.getAll().subscribe({
      next: (list) => this.links.set(list),
    });
  }

  onInput(event: Event): void {
    this.urlInput.set((event.target as HTMLInputElement).value);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const url = this.urlInput().trim();
    if (!this.isValidUrl(url)) {
      this.error.set('Enter a valid http or https URL.');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.newLink.set(null);

    this.svc.create(url).subscribe({
      next: (link) => {
        this.newLink.set(link);
        this.urlInput.set('');
        this.submitting.set(false);
        this.loadLinks();
      },
      error: (err) => {
        this.error.set(err.error?.error ?? err.message ?? 'Request failed.');
        this.submitting.set(false);
      },
    });
  }
}
