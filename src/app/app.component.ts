import { Component } from "@angular/core";
import { EditorComponent } from "@tinymce/tinymce-angular";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { FormsModule } from "@angular/forms";
import { environment } from '../environments/environment';
import { fetchEventSource } from '@microsoft/fetch-event-source';

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    EditorComponent,
    MatButtonModule,
    MatMenuModule,
    FormsModule
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  apiKey = environment.tinymceApiKey;
  editorContent = "";

  editorConfig = {
    plugins: 'advcode a11ychecker autocorrect autolink emoticons image link linkchecker lists markdown powerpaste tinymcespellchecker help',
    toolbar: 'undo redo | styles | bold italic underline strikethrough | forecolor backcolor | superscript subscript | removeformat | link image emoticons | align  | spellcheckdialog a11ycheck | code | markdown',
    height: 500,
    elementpath: false,
    visual: false,
    link_target_list: false,
    object_resizing: false,
    formats: {
      h1: { block: 'h1', styles: { fontSize: '24px', color: '#335dff' } },
      h2: { block: 'h2', styles: { fontSize: '20px' } },
      largetext: { block: 'p', styles: { fontSize: '20px' } },
      calltoaction: { selector: 'a', styles: { backgroundColor: '#335dff', padding: '12px 16px', color: '#ffffff', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' } }
    },
    style_formats: [
      { title: 'Paragraph', format: 'p' },
      { title: 'Heading 1', format: 'h1' },
      { title: 'Heading 2', format: 'h2' },
      { title: 'Large text', format: 'largetext' },
      { title: 'Button styles' },
      { title: 'Call-to-action', format: 'calltoaction' },
    ],
    images_file_types: "jpeg,jpg,png,gif",
    spellchecker_ignore_list: [ 'i.e', 'Mailchimp', 'CSS-inlined' ],
    advcode_inline: true,
  };

  getInlinedCSS() {
    const editor = (window as any).tinymce.get('editor');
    editor.plugins.inlinecss.getContent().then((value: any) => {
      console.log(value.html);
    });
  }
}
