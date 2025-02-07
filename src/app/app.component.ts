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
  editorContent = `
    <table style="background-color: #f9f9fb; width: 100%;" border="0">
      <tr>
        <td align="center">
          <table border="0" width="100%" style="max-width: 660px; width: 100%; background-color: #0b132c; border: 2px solid #eee; border-radius: 8px 8px 0 0; overflow: hidden" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 32px 8px 16px 64px;" width="50%">
                <div class="tiny-editable" style="font-family: 'helvetica', sans-serif; color: #fff; font-size: 16px; line-height: 1.5;">
                  <h1>🤖 The AI Revolution Weekly</h1>
                </div>
              </td>
              <td style="padding: 16px 64px 16px 8px;" width="50%">
                <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995" width="256" height="256" alt="AI Generated Art">
              </td>
            </tr>
          </table>

          <table border="0" width="100%" style="max-width: 660px; width: 100%; background-color: #ffffff; border: 2px solid #eee; border-radius: 8px; overflow: hidden" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 16px 64px 0;" colspan="2">
                <div class="tiny-editable" style="font-family: 'helvetica', sans-serif; color: #243376;">
                  <p style="font-size: 20px; text-align: center;">Hey AI Explorer! 👋</p>
                  <p style="font-size: 20px; text-align: center;">Ready to dive into this week's AI breakthroughs?</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 64px 16px;" colspan="2">
                <div class="tiny-editable" style="font-family: 'helvetica', sans-serif; color: #243376;">
                  <h2 style="text-align: left; font-size: 24px; color: #335dff;">🎨 Midjourney V6: A New Era in AI Art</h2>
                  <p>The latest version is revolutionizing digital art with unprecedented photorealism and creative capabilities. Artists are creating masterpieces that blur the line between human and AI-generated art.</p>

                  <h2 style="text-align: left; font-size: 24px; color: #335dff;">🧠 GPT-4 Turbo: Smarter Than Ever</h2>
                  <p>OpenAI's latest model brings extended context windows and up-to-date knowledge, making it the perfect companion for complex tasks and creative projects.</p>

                  <h2 style="text-align: left; font-size: 24px; color: #335dff;">🎵 The Sound of AI</h2>
                  <p>From personalized playlists to AI-composed symphonies, music generation models are hitting all the right notes in 2025.</p>

                  <p style="text-align: center; margin-top: 32px;"><a style="background-color: rgb(51, 93, 255); padding: 12px 24px; color: rgb(255, 255, 255); border-radius: 4px; text-decoration: none; display: inline-block; font-weight: bold;" href="#">Join Our AI Community</a></p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #eff0f6; padding: 24px 64px;" colspan="2">
                <p style="margin: 0; font-family: 'helvetica'; font-size: 12px; color: #a0a9c5;">Stay curious, stay innovative! 🚀</p>
                <p style="margin: 0; font-family: 'helvetica'; font-size: 12px; color: #a0a9c5;">{{Subscription.UnsubscribeLink}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  ai_request = (request: any, respondWith: any) => {
    respondWith.stream((signal: any, streamMessage: any) => {
      // Adds each previous query and response as individual messages
      const conversation = request.thread.flatMap((event: any) => {
        if (event.response) {
          return [
            { role: 'user', content: event.request.query },
            { role: 'assistant', content: event.response.data }
          ];
        } else {
          return [];
        }
      });

      // System messages provided by the plugin to format the output as HTML content
      const pluginSystemMessages = request.system.map((content: string) => ({
        role: 'system',
        content
      }));

      const systemMessages = [
        ...pluginSystemMessages,
        // Additional system messages to control the output of the AI
        { role: 'system', content: 'Remove lines with ``` from the response start and response end.' }
      ]

      // Forms the new query sent to the API
      const content = request.context.length === 0 || conversation.length > 0
        ? request.query
        : `Question: ${request.query} Context: """${request.context}"""`;

      const messages = [
        ...conversation,
        ...systemMessages,
        { role: 'user', content }
      ];

      const requestBody = {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 800,
        messages,
        stream: true
      };

      const openAiOptions = {
        signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${environment.openaiApiKey}`
        },
        body: JSON.stringify(requestBody)
      };

      const onopen = async (response: Response) => {
        if (response) {
          const contentType = response.headers.get('content-type');
          if (response.ok && contentType?.includes('text/event-stream')) {
            return;
          } else if (contentType?.includes('application/json')) {
            const data = await response.json();
            if (data.error) {
              throw new Error(`${data.error.type}: ${data.error.message}`);
            }
          }
        } else {
          throw new Error('Failed to communicate with the ChatGPT API');
        }
      };

      const onmessage = (ev: any) => {
        const data = ev.data;
        if (data !== '[DONE]') {
          const parsedData = JSON.parse(data);
          const firstChoice = parsedData?.choices[0];
          const message = firstChoice?.delta?.content;
          if (message) {
            streamMessage(message);
          }
        }
      };

      const onerror = (error: Error) => {
        throw error;
      };

      return fetchEventSource('https://api.openai.com/v1/chat/completions', {
        ...openAiOptions,
        openWhenHidden: true,
        onopen,
        onmessage,
        onerror
      });
    });
  };

  editorConfig = {
    plugins: 'ai advcode advtemplate a11ychecker autocorrect autolink emoticons image inlinecss link linkchecker lists markdown mergetags powerpaste tinymcespellchecker help',
    toolbar_groups: {
      formatting: {
        icon: 'format',
        tooltip: 'Formatting',
        items: 'bold italic underline strikethrough | forecolor backcolor | superscript subscript | removeformat'
      }
    },
    toolbar: 'undo redo | aidialog aishortcuts | styles | formatting | link image emoticons | align | mergetags inserttemplate | spellcheckdialog a11ycheck | code | markdown',
    toolbar_sticky: true,
    menubar: false,
    statusbar: false,
    height: 1020,
    editable_root: false,
    editable_class: 'tiny-editable',
    elementpath: false,
    visual: false,
    link_target_list: false,
    link_list: [
      { title: "Features", value: 'https://www.tiny.cloud/tinymce/features/' },
      { title: "Docs", value: 'https://www.tiny.cloud/docs/tinymce/latest/' },
      { title: "Pricing", value: 'https://www.tiny.cloud/pricing/' }
    ],
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
    ai_shortcuts: [
      { title: 'Format as marketing email', prompt: 'Turn this content into an HTML-formatted marketing email in fixed-width and mobile-friendly table form, following screen width best practices' },
      { title: 'Generate call to action', prompt: 'Generate an appropriate and short call to action for this email, in the form a button.' }
    ],
    images_file_types: "jpeg,jpg,png,gif",
    spellchecker_ignore_list: [ 'i.e', 'Mailchimp', 'CSS-inlined' ],
    mergetags_list: [
      {
        title: "Contact",
        menu: [{
          value: 'Contact.FirstName',
          title: 'Contact First Name'
        },
        {
          value: 'Contact.LastName',
          title: 'Contact Last Name'
        },
        {
          value: 'Contact.Email',
          title: 'Contact Email'
        }
        ]
      },
      {
        title: "Sender",
        menu: [{
          value: 'Sender.FirstName',
          title: 'Sender First Name'
        },
        {
          value: 'Sender.LastName',
          title: 'Sender Last name'
        },
        {
          value: 'Sender.Email',
          title: 'Sender Email'
        }
        ]
      },
      {
        title: 'Subscription',
        menu: [{
          value: 'Subscription.UnsubscribeLink',
          title: 'Unsubscribe Link'
        },
        {
          value: 'Subscription.Preferences',
          title: 'Subscription Preferences'
        }
        ]
      }
    ],
    advtemplate_templates: [
      {
        title: "Newsletter intro",
        content:
          '<h1 style="font-size: 24px; color: rgb(51, 93, 255); font-family:Arial;">TinyMCE Newsletter</h1>\n<p style="font-family:Arial;">Welcome to your monthly digest of all things TinyMCE, where you\'ll find helpful tips, how-tos, and stories of how people are using rich text editing to bring their apps to new heights!</p>',
      },
      {
        title: "CTA Button",
        content:
          '<p><a style="background-color: rgb(51, 93, 255); padding: 12px 16px; color: rgb(255, 255, 255); border-radius: 4px; text-decoration: none; display: inline-block; font-family:Arial;" href="https://tiny.cloud/pricing">Get started with your 14-day free trial</a></p>',
      },
      {
        title: "Footer",
        content:
          '<p style="text-align: center; font-size: 10px; font-family:Arial;">You received this email at because you previously subscribed.</p>\n<p style="text-align: center; font-size: 10px; font-family:Arial;">{{Subscription.Preferences}} | {{Subscription.UnsubscribeLink}}</p>',
      },
    ],
    ai_request: this.ai_request,
    advcode_inline: true,
    content_style: `
      body {
        background-color: #f9f9fb;
      }

      /* Edit area functional css */
      .tiny-editable {
        position: relative;
      }
      .tiny-editable:hover:not(:focus),
      .tiny-editable:focus {
        outline: 3px solid #b4d7ff;
        outline-offset: 4px;
      }

      /* Create an edit placeholder */
      .tiny-editable:empty::before,
      .tiny-editable:has(> br[data-mce-bogus]:first-child)::before {
        content: "Write here...";
        position: absolute;
        top: 0;
        left: 0;
        color: #999;
      }
    `
  };

  getInlinedCSS() {
    const editor = (window as any).tinymce.get('editor');
    editor.plugins.inlinecss.getContent().then((value: any) => {
      console.log(value.html);
    });
  }
}
