import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import AddQuestionModal from '../components/AddQuestionModal';
import MenuHeader from '../components/MenuHeader';
import DefaultFooter from '../components/DefaultFooter';
import './ViewQuizPage.css';
import EditQuestionModal from '../components/EditQuestionModal.js';
const path = require('../components/Path.js');

const ViewQuizPage = () => {

  const { quizID } = useParams();
  // const dummyQuestions = [{Question: "How are you today?", _id: "1"},
  //                         {Question: "This is question two", _id: "2"}, 
  //                         {Question: "Are you stupid?", _id: "3"},
  //                         {Question: "This is very very dumb", _id: "4"}];
  const [quizInfo, setQuizInfo] = useState({Name: "Failed to load quiz..."});
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [editedQuestion, setEditedQuestion] = useState({});

  // States for opening/closing modals
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isEditQuestionOpen, setIsEditQuestionOpen] = useState(false);

  // Functions for opening modals
  function openAddQuestion(e) {
    e.preventDefault();
    setIsAddQuestionOpen(true);
  }
  function openEditQuestion(e, qa) {
    e.preventDefault();
    setEditedQuestion(qa);
    setIsEditQuestionOpen(true);
  }

  // Navigate back and forth through flashcards
  const moveFlashCardForward = (e) => {
    e.preventDefault();
    setCurrentQuestion((currentQuestion + 1) % questionsAndAnswers.length);
  }
  const moveFlashCardBackward = (e) => {
    e.preventDefault();
    if (currentQuestion <= 0) {
      setCurrentQuestion(questionsAndAnswers.length - 1);
    } else {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  const fetchQuizInfo = async () => {
    const fetchParams = {
      id: quizID
    }
    try {
      const res = await axios.post(path.buildPath('/api/quizzes/get/'), fetchParams);
      if (res !== undefined && res.data.result.length !== 0) {
        setQuizInfo(res.data.result[0]);
      }
    }
    catch {
      return;
    }
  }

  const fetchQuestionsAndAnswers = async () => {
    const fetchParamsQ = {
      term: "",
      quizId: quizID
    }
    try {
      // Fetch question info
      const resQ = await axios.post(path.buildPath('/api/questions/search/'), fetchParamsQ);
      if (resQ !== undefined && resQ.data.result.length !== 0) {
        setCurrentQuestion(0);
        // Fetch answer info for each question
        const qas = []
        for (let i = 0; i < resQ.data.result.length; i++) {
          const fetchParamsA = {
            questionId: resQ.data.result[i]._id
          }
          const resA = await axios.post(path.buildPath('/api/answers/get/'), fetchParamsA);
          if (resA !== undefined && resA.data.result.length !== 0) {
            const qa = {
              question: resQ.data.result[i],
              answers: resA.data.result
            }
            qas.push(qa);
          }
        }
        setQuestionsAndAnswers(qas);
      }
    } catch {
      return;
    }
  }

  // Fetch Quiz info and all Questions related to that quiz
  useEffect(() => {
    fetchQuizInfo();
    fetchQuestionsAndAnswers();
    setIsLoading(false);
  }, []);

  const deleteQuestion = async (e, qa) => {
    e.preventDefault();
    try {
      const userConfirmation = window.confirm(`Are you sure you want to delete this question?`);
      if (userConfirmation) {
        console.log('Question has been deleted!');
        // TODO: Delete all answers associated with this question
        const allAnswers = qa.answers;
        for (let i = 0; i < allAnswers.length; i++) {
          await axios.post(path.buildPath('/api/answers/delete'), {id: allAnswers[i]._id});
        }
        // TODO: Delete question
        const questionId = qa.question._id;
        await axios.post(path.buildPath('/api/questions/delete'), {id: questionId});
      }
      window.location.reload();
    }
    catch (err) {
      console.log(err);
    }
  }

  return (
    <div id='vqp-container'>
      <AddQuestionModal 
        isAddQuestionOpen={isAddQuestionOpen}
        setIsAddQuestionOpen={setIsAddQuestionOpen}
        quizID={quizID}
      />
      <EditQuestionModal
        isEditQuestionOpen={isEditQuestionOpen}
        setIsEditQuestionOpen={setIsEditQuestionOpen}
        editedQuestion={editedQuestion}
      />
      <MenuHeader />
      
      <div id='vqp-body-container'>
        <div id='vqp-body'>
          <p id='vqp-quiz-title'>{quizInfo.Name}</p>
          <div id='vqp-quiz-options'>
            <button className='vqp-qo' onClick={event =>  window.location.href=`/taketest/${quizID}`}>Take Test</button>
            <button className='vqp-qo'>Save Quiz</button>
            <button className='vqp-qo' onClick={openAddQuestion}>Add Question</button>
          </div>
          <div id='vqp-flashcard'>
            <div id='flip-card-inner'>
              <div className='flip-card-side' id='flip-card-front'>
                <p id='vqp-flashcard-q'>
                  {(questionsAndAnswers.length === 0) ? "No Questions :(" : `${questionsAndAnswers[currentQuestion].question.Question}`}
                </p>
              </div>
                <div className='flip-card-side' id='flip-card-back'>
                <p id='vqp-flashcard-q'>
                {(questionsAndAnswers.length === 0) ? "No Answers :(" : `${questionsAndAnswers[currentQuestion].answers.find((a) => !a.WrongAnswer).Answer}`}
                  </p>
              </div>
            </div>
          </div>
          <div id='vqp-flashcard-nav'>
            <button className='nav-btn' id='nav-btn-back' onClick={moveFlashCardBackward}>{"←"}</button>
            <p id='flashcard-nav-count'>{`${currentQuestion + 1} / ${isLoading ? 0 : questionsAndAnswers.length}`}</p>
            <button className='nav-btn' id='nav-btn-forward' onClick={moveFlashCardForward}>{"→"}</button>
          </div>
          <ul id='vqp-questions-ul'>
            {questionsAndAnswers.map((qa) => {
              return (
                <li key={qa.question._id}>
                  <div className='vqp-questions-li'>
                    <div className='vqp-questions-li-q'>{`${qa.question.Question}`}</div>
                    <div className='vqp-questions-li-a'>{`${qa.answers.find((a) => !a.WrongAnswer).Answer}`}</div>
                    <div className='vqp-questions-li-o'>
                      <button onClick={(e) => openEditQuestion(e, qa)}>Edit</button>
                      <button onClick={(e) => deleteQuestion(e, qa)}>Delete</button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <DefaultFooter />
    </div>
  )
}

export default ViewQuizPage;