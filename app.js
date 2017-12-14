'use strict';

// User chooses number of questions >> add amount options
// User chooses only one category >> add category options
// Only multiple choice questions
// Set new query
// Send a request to trivia api to fetch questions
// Generate quiz with fetched questions

const BASE_URL = 'https://opentdb.com';
const MAIN_PATH = '/api.php';
const TOKEN_PATH = '/api_token.php';
const CAT_PATH = '/api_category.php';
let token = '';
let amountOfQuestions = 0;
let category = 9;

// Build endpoint URL
function buildBASEUrl() {
  return BASE_URL + MAIN_PATH;
}

function buildTokenUrl() {
  return BASE_URL + TOKEN_PATH;
}


// Where do I call these functions?
// Before DOM loads or after?


// Fetch data
function fetchToken() {
  $.getJSON(buildTokenUrl(), {command: 'request'}, response => {
    token = response.token;
    console.log(`session token fetched: ${token}`);
  });
}

function fetchQuestions() {
  const query = {
    category: category,
    amount: amountOfQuestions,
    token: token,
    type: 'multiple'
  };
  console.log(query);
  $.getJSON(buildBASEUrl(), query, response => {
    console.log('questions fetched:', response.results);
    let decoratedQuestions = decorateQuestions(response.results);
    console.log(decoratedQuestions);
    addQuestions(decoratedQuestions);
    console.log(QUESTIONS);
  });
}


function fetchCategory() {

}

// Decorate responses
function decorateQuestions(data) {
  const randomAnswers = [...data[0].incorrect_answers];
  const randomIndex = Math.floor(Math.random() * (data[0].incorrect_answers.length + 1));
  randomAnswers.splice(randomIndex, 0, data[0].correct_answer);
  return {
    text: data[0].question,
    answers: randomAnswers,
    correctAnswer: data[0].correct_answer,
  };
}

// Add questions to store
function addQuestions(decoratedQuestions) {
  QUESTIONS.push(decoratedQuestions);
}



const TOP_LEVEL_COMPONENTS = [
  'js-intro', 'js-question', 'js-question-feedback', 'js-outro', 'js-quiz-status'
];

const QUESTIONS = [];

const getInitialStore = function() {
  return {
    page: 'intro',
    currentQuestionIndex: null,
    userAnswers: [],
    feedback: null,
    userAmount: null,
    userCategory: null,
  };
};

let store = getInitialStore();

// Helper functions
// ===============
const hideAll = function() {
  TOP_LEVEL_COMPONENTS.forEach(component => $(`.${component}`).hide());
};

const getScore = function() {
  return store.userAnswers.reduce((accumulator, userAnswer, index) => {
    const question = getQuestion(index);

    if (question.correctAnswer === userAnswer) {
      return accumulator + 1;
    } else {
      return accumulator;
    }
  }, 0);
};

const getProgress = function() {
  return {
    current: store.currentQuestionIndex + 1,
    total: QUESTIONS.length
  };
};

const getCurrentQuestion = function() {
  return QUESTIONS[store.currentQuestionIndex];
};

const getQuestion = function(index) {
  return QUESTIONS[index];
};

// HTML generator functions
// ========================
const generateAnswerItemHtml = function(answer) {
  return `
    <li class="answer-item">
      <input type="radio" name="answers" value="${answer}" />
      <span class="answer-text">${answer}</span>
    </li>
  `;
};

const generateQuestionHtml = function(question) {
  const answers = question.answers
    .map((answer, index) => generateAnswerItemHtml(answer, index))
    .join('');

  return `
    <form>
      <fieldset>
        <legend class="question-text">${question.text}</legend>
          ${answers}
          <button type="submit">Submit</button>
      </fieldset>
    </form>
  `;
};

const generateFeedbackHtml = function(feedback) {
  return `
    <p>${feedback}</p>
    <button class="continue js-continue">Continue</button>
  `;
};

// Render function - uses `store` object to construct entire page every time it's run
// ===============
const render = function() {
  let html;
  hideAll();

  const question = getCurrentQuestion();
  const { feedback } = store;
  const { current, total } = getProgress();

  $('.js-score').html(`<span>Score: ${getScore()}</span>`);
  $('.js-progress').html(`<span>Question ${current} of ${total}`);

  switch (store.page) {
  case 'intro':
    $('.js-intro').show();
    break;

  case 'question':
    html = generateQuestionHtml(question);
    $('.js-question').html(html);
    $('.js-question').show();
    $('.quiz-status').show();
    break;

  case 'answer':
    html = generateFeedbackHtml(feedback);
    $('.js-question-feedback').html(html);
    $('.js-question-feedback').show();
    $('.quiz-status').show();
    break;

  case 'outro':
    $('.js-outro').show();
    $('.quiz-status').show();
    break;

  default:
    return;
  }
};

// Event handler functions
// =======================
const handleStartQuiz = function() {
  store = getInitialStore();
  store.page = 'question';
  store.currentQuestionIndex = 0;
  amountOfQuestions = parseInt($('#qId option:selected').val());
  fetchQuestions();
  render();
};

const handleSubmitAnswer = function(e) {
  e.preventDefault();
  const question = getCurrentQuestion();
  const selected = $('input:checked').val();
  store.userAnswers.push(selected);

  if (selected === question.correctAnswer) {
    store.feedback = 'You got it!';
  } else {
    store.feedback = `Too bad! The correct answer was: ${question.correctAnswer}`;
  }

  store.page = 'answer';
  render();
};

const handleNextQuestion = function() {
  if (store.currentQuestionIndex === QUESTIONS.length - 1) {
    store.page = 'outro';
    render();
    return;
  }

  store.currentQuestionIndex++;
  store.page = 'question';
  render();
};


fetchToken();

// On DOM Ready, run render() and add event listeners
$(() => {
  render();
  $('.js-start').attr('disabled', 'disabled');

  // $('.js-intro').on('click', '.js-start', fetchQuestions);
  $('.js-intro, .js-outro').on('click', '.js-start', handleStartQuiz);
  $('.js-question').on('submit', handleSubmitAnswer);
  $('.js-question-feedback').on('click', '.js-continue', handleNextQuestion);
});
