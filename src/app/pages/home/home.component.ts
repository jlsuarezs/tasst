import { Component, OnInit, ViewChild } from '@angular/core';
import { BotComponent } from '../../components/bot/bot.component';

const ACTION_WELCOME = 'WELCOME';
const ACTION_START_QUIZ = 'START QUIZ';
const ACTION_ANSWER = 'ANSWER';

import { QuizService } from '../../services/quiz.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [QuizService]
})
export class HomeComponent implements OnInit {

  @ViewChild('bot') bot: BotComponent;

  // Welcome message to sync with animations
  welcome: Array<{}> = [{ message: ' ', image: 'https://media.giphy.com/media/DwXOS8RqHocEM/200w_d.gif', command: 'message' }];

  // Quiz
  quiz: any = {};
  currentQuestionIndex = -1;
  requests: Array<{}> = [];
  replays: Array<{}> = [];
  results: any = {};
  lastTypingIndex = -1;

  // Sounds
  actionSound = null;
  errorSound = null;

  constructor(private quizService: QuizService) {
    this.actionSound = new Audio('assets/sounds/action.mp3');
    this.errorSound = new Audio('assets/sounds/error.mp3');
  }

  ngOnInit() {
    setTimeout(async () => {
      await this.startBot();
    }, 400);
  }

  async startBot() {
    await this.bot.add({ message: 'I am Tasst, your bot! Enough talking, let\'s take a quiz? 👌🏻👏🏻', command: 'message' });
    await this.bot.add({ message: { state: ACTION_WELCOME, actions: [{ caption: ACTION_START_QUIZ, type: 'button', icon: 'ti-rocket', hideCaption: false }] }, command: 'actions' });
  }

  async startQuiz() {
    this.actionSound.play();
    await this.bot.add({ message: `Sure, let\'s do it!`, command: 'message' });

    // Typing animation, delayed message
    const i = this.bot.showTyping('Ok, here we go.');

    // GET QUIZ!
    this.quiz = await this.quizService.getQuiz();
    this.results['total'] = this.quiz.questions.length;
    this.bot.removeTyping(i);

    await this.nextQuestion();
  }

  async playQuestion(currentQuestion: any) {
    if (!currentQuestion) { return; }

    // QUESTION
    await this.bot.add({ message: `${currentQuestion.question} [Question: ${currentQuestion.id}]`, command: 'message' });

    // ANSWERS
    const answers: Array<any> = currentQuestion.answers.map((item: any) => {
      return { caption: item.text, type: 'button', hideCaption: false, tag: 'answer', questionId: currentQuestion.id, answerIndex: item.index };
    });
    await this.bot.add({ message: { state: ACTION_ANSWER, actions: answers }, command: 'actions' });
  }

  answerQuestion(questionId: string, answerIndex: number) {
    this.requests.push(questionId);
    this.quizService.answerQuestion(questionId, answerIndex).subscribe(
      (x) => { },
      (error: any) => {
        // Anti-pattern?
        console.error(`** SERVER ERROR > ${error.message}! ${error.questionId}/${error.answerIndex} **`);
        this.replays.push(error.questionId);
      }).add(() => {
        this.checkGameOver(questionId);
      });
  }

  async checkGameOver(questionId: string) {
    if (!(this.quiz['questions'] instanceof Array)) { return; }

    // PENDING REQUESTS?
    this.requests.splice(this.requests.indexOf(questionId), 1);
    if (this.requests.length > 0) { return; }

    // REMOVE TYPING ANIMATION
    if ( this.lastTypingIndex !== -1 ) { this.bot.removeTyping(this.lastTypingIndex); }

    // GAME OVER?
    if (this.currentQuestionIndex >= this.quiz.questions.length && this.replays.length > 0) {
      await this.replayQuestion();
    } else if (this.currentQuestionIndex >= this.quiz.questions.length) {
      await this.gameOver();
    }
  }

  async replayQuestion() {
    let question = null;
    for (const obj of this.quiz.questions) {
      if (obj.id === this.replays[0]) {
        question = obj;
        break;
      }
    }
    if (question !== null) {
      await this.playQuestion(question);
      this.replays.shift();
    }
  }

  async checkAnswer(questionId: string, answerIndex: number) {
    // INDEX = 0? CORRECT ANSWER
    if (answerIndex === 0) {
      this.actionSound.play();
      await this.bot.add({ message: `THAT'S RIGHT! ✅👍🏻`, command: 'message' });

      // RESULTS
      this.results[questionId] = 1;
      console.log(`#### RESULTS > ${JSON.stringify(this.results)}! ####`);
    } else {
      this.errorSound.play();
      await this.bot.add({ message: `OOPS, THAT'S WRONG! 🚨👎🏻`, command: 'message' });
    }
  }

  async nextQuestion() {
    if (!(this.quiz['questions'] instanceof Array)) { return; }

    // NEW QUESTION
    if (this.currentQuestionIndex === -1) { this.currentQuestionIndex = 0; } else { this.currentQuestionIndex++; }

    // LAST QUESTION?
    if (this.lastTypingIndex === -1 && this.currentQuestionIndex >= this.quiz.questions.length) {
      this.lastTypingIndex = this.bot.showTyping('😉');
      return;
    }
    await this.playQuestion(this.quiz.questions[this.currentQuestionIndex]);
  }

  async gameOver() {
    console.log(`-- GAME OVER --`);
    this.quiz = {};
    this.currentQuestionIndex = -1;
    this.requests = [];
    this.replays = [];
    this.lastTypingIndex = -1;
    await this.bot.add({ message: ' ', image: 'https://media.giphy.com/media/g9582DNuQppxC/200w_d.gif', command: 'message' });
    await this.bot.add({ message: `You must keep going, you must keep pushing forward.....${Object.keys(this.results).length - 1} of ${this.results['total']}! 👍🏻👌🏻`, command: 'message' });
    await this.bot.add({ message: `Let's play again?`, command: 'message' });
    await this.bot.add({ message: { state: ACTION_START_QUIZ, actions: [{ caption: ACTION_START_QUIZ, type: 'button', icon: 'ti-rocket', hideCaption: false }] }, command: 'actions' });
    this.results = {};
  }

  async onAction(event: any) {
    if (event.object.caption === ACTION_START_QUIZ) {
      // START QUIZ!
      await this.startQuiz();
    } else if (event.object.tag === 'answer') {
      // INMMEDIATE FEEDBACK
      await this.checkAnswer(event.object.questionId, event.object.answerIndex);

      // ANSWER QUESTION
      this.answerQuestion(event.object.questionId, event.object.answerIndex);

      // REPLAY QUESTION?
      if (this.replays.length > 0) {
        await this.replayQuestion();
      } else {
        // NEXT QUESTION
        await this.nextQuestion();
      }
    } else {
      // RESTART
      await this.startBot();
    }
  }
}
