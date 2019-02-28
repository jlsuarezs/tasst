import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'sanitizeHtml'
})
export class SanitizePipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

   transform(v: string): SafeHtml {
      return this.sanitizer.bypassSecurityTrustHtml(v);
   }
}
