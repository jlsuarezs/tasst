import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { trigger, style, transition, animate, query, stagger } from '@angular/animations';

import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-bot',
  templateUrl: './bot.component.html',
  styleUrls: ['./bot.component.scss'],
  animations: [
    trigger('logoAnimation', [
      transition('* => *', [
        query('.row', style({ opacity: 0, transform: 'translateX(-10px)' })),
        query('.row', stagger('0ms', [
          animate('600ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
        ]))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', style({ opacity: 0, transform: 'translateX(-15px)' })),
        query(':enter', stagger('0ms', [
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
        ]))
      ])
    ])
  ]
})
export class BotComponent implements OnInit {

  bot: any = [];
  triggerAction: Subject<any> = new Subject<any>();

  @Input() initial: Array<any> = [];
  @Output() action: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    this.init();
  }

  async init() {
    for (const o of this.initial) {
      await this.add(o);
    }
  }

  async add(o: any) {
    if (o.command === 'actions') {
      await this.addBotActions(o.message);
    } else if (o.command === 'input') {
      await this.addBotInput(o.message);
    } else {
      await this.addBotMessage(o.message, o.image || '');
    }
  }

  onAction(i: number, state: string, object: any) {
    this.triggerAction.next({ i, message: object.caption });
    this.action.emit({ state, object });
    event.preventDefault();
  }

  onKeyUp(botInput: any, btnSubmit: any) {
    btnSubmit.disabled = !botInput.validity.valid;
    return true;
  }

  scrollToBottom() {
    const w: any = window;
    setTimeout(() => {
      if (w.$('html, body') && (w.$('#section-end') && w.$('#section-end').offset())) {
        w.$('html, body').animate({ scrollTop: w.$('#section-end').offset().top - 60 }, 1000);
      }
    }, 300);
  }

  showTyping(message: string) {
    return this.bot.push({ message, typing: true, from: 'bot' }) - 1;
  }

  removeTyping(index: number) {
    this.bot[index].typing = false;
    this.scrollToBottom();
  }

  addBotMessage(message: string, image: string) {
    return new Promise((resolve) => {
      const i = this.bot.push({ message, image, typing: true, from: 'bot' }) - 1;
      setTimeout(() => {
        this.bot[i].typing = false;
        this.scrollToBottom();
        resolve(i);
      }, 1000);
    });
  }

  addBotActions(object: any) {
    return new Promise((resolve) => {
      const tmpActions = {};
      tmpActions['state'] = object.state;
      tmpActions['actions'] = object.actions;
      tmpActions['typing'] = false;
      tmpActions['from'] = 'bot';
      const i = this.bot.push(tmpActions) - 1;
      this.triggerAction.pipe(take(1)).subscribe((response: any) => {
        this.bot.splice(response.i, 1);
        this.bot.push({ message: response.message, typing: false, from: 'me' });
        this.scrollToBottom();
        resolve(response.i);
      });
    });
  }

  addBotInput(input: any) {
    return new Promise((resolve) => {
      const tmpInput = input;
      tmpInput['typing'] = false;
      tmpInput['input'] = true;
      tmpInput['from'] = 'bot';
      const i = this.bot.push(tmpInput) - 1;
      this.triggerAction.pipe(take(1)).subscribe((response: any) => {
        this.bot.splice(response.i, 1);
        this.bot.push({ message: response.message, typing: false, from: 'me' });
        this.scrollToBottom();
        resolve(response.i);
      });
    });
  }
}
