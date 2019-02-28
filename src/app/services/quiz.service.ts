import { Injectable } from '@angular/core';

// RXJS
import { Observable, from } from 'rxjs';

const ALPHANUMERIC: any = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

/**
 * Mocks retrieving a Quiz from the server.
 *
 * Latency can be high (up to 3000ms).
 */
const getQuiz = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(generateQuiz());
    }, randomInt(3000));
  });
};

/**
 * Mocks sending a response to the server.
 *
 * Latency can be very high (up to 8000ms).
 * Failure is also likely (10% of calls fail).
 */
const answerQuestion = (questionId: string, answerIndex: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (randomInt(10) < 10) {
        resolve({questionId, answerIndex});
      } else {
        reject({questionId, answerIndex, message: 'REPLAY QUESTION'});
      }
    }, randomInt(8000));
  });
};

const generateQuiz = () => {
  const quiz = {
    id: generateString(ALPHANUMERIC, 8),
    questions: []
  };
  for (let i = 8; i > 0; i--) {
    quiz.questions.push(generateQuestion());
  }
  return quiz;
};

const generateQuestion = () => {
  const answers = [];
  for (let index = 3; index >= 0; index--) {
    const length = randomInt(20);
    answers.push({
      index,
      text: generatePseudoSentence(length),
    });
  }
  return {
    id: generateString(ALPHANUMERIC, 9),
    question: generatePseudoSentence( randomInt(30) ) + '?',
    answers
  };
};

const generateString = (chars: any, length: number) => {
  let id = '';
  for (let i = length; i > 0; i--) {
    id += chars[randomInt(chars.length) - 1];
  }
  return id;
};

const generatePseudoSentence = (num: number) => {
  const LETTERS = 'abcdefghiklmnopqrstuvwxyz'.split('');
  const words = [];
  for (let i = num; i > 0; i--) {
    const length = randomInt(9);
    words.push(generateString(LETTERS, length));
  }
  return words.join(' ');
};

const randomInt = (max: number) => {
  return Math.ceil(Math.random() * max);
};

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  constructor() { }

  public getQuiz(): Promise<{}> {
    return getQuiz();
  }

  public answerQuestion(questionId: string, answerIndex: number): Observable<any>  {
    return from(answerQuestion(questionId, answerIndex));
  }
}
