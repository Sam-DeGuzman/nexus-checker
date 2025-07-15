import React, { useState } from 'react'
import statesData from '../utils/states.json'

/**
 * QuestionCard component for Nexus Checker
 * Props:
 * - state: state code (e.g. 'MO')
 * - stateData: { question: string | null, physical_prompts: string[] }
 * - onAnswer: function(state, answerObj)
 */
export default function QuestionCard({ state, stateData, onAnswer }) {
  // Multi-step: 0 = main question, 1+ = physical prompts
  const [step, setStep] = useState(0)
  const totalSteps = 1 + (stateData.physical_prompts?.length || 0)

  // Determine current question text
  let questionText = null
  if (step === 0) {
    questionText = stateData.question
  } else {
    questionText = stateData.physical_prompts[step - 1]
  }

  // Find state name from states.json
  const stateName = statesData.states.find(s => s.id === state)?.name || state;

  // Handle answer for current step
  function handleStepAnswer(answer) {
    if (step === 0) {
      const economicAnswer = { economic: answer }
      if (totalSteps > 1) {
        setStep(1)
        // Store economic answer in closure for next steps
        QuestionCard._pendingAnswers = economicAnswer
      } else {
        // No physical prompts, finish
        onAnswer(state, economicAnswer)
      }
    } else {
      // Physical prompt answer
      const prev = QuestionCard._pendingAnswers || {}
      const newAnswers = { ...prev, ["physical_" + (step - 1)]: answer }
      if (step < totalSteps - 1) {
        setStep(step + 1)
        QuestionCard._pendingAnswers = newAnswers
      } else {
        // Last prompt, finish
        onAnswer(state, newAnswers)
        QuestionCard._pendingAnswers = undefined
      }
    }
  }

  // Progress indicator: show step out of totalSteps
  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-md tw-p-6 tw-max-w-2xl tw-mx-4 md:tw-mx-auto tw-mb-6">
      {/* Progress Indicator */}
      <div className="tw-text-xs tw-text-gray-500 tw-mb-2 tw-font-medium">
        {step + 1} of {totalSteps}
      </div>
      {/* State Name */}
      <div className="tw-text-gray-800 tw-font-semibold tw-mb-2" id="state-name">
        {stateName}
      </div>
      {/* Question */}
      <div className="tw-text-gray-700 tw-mb-6 tw-text-lg">
        {questionText}
      </div>
      {/* Answer Buttons */}
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4">
        <button
          type="button"
          className="tw-bg-blue-500 tw-text-white tw-px-6 tw-py-3 tw-rounded tw-shadow-sm tw-font-semibold tw-transition hover:tw-bg-blue-600 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-400"
          onClick={() => handleStepAnswer('yes')}
        >
          Yes
        </button>
        <button
          type="button"
          className="tw-bg-white tw-text-gray-700 tw-border tw-border-gray-300 tw-px-6 tw-py-3 tw-rounded tw-font-semibold tw-transition hover:tw-bg-blue-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-400"
          onClick={() => handleStepAnswer('no')}
        >
          No
        </button>
        <button
          type="button"
          className="tw-bg-white tw-text-gray-700 tw-border tw-border-gray-300 tw-px-6 tw-py-3 tw-rounded tw-font-semibold tw-transition hover:tw-bg-blue-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-400"
          onClick={() => handleStepAnswer('not_sure')}
        >
          Not Sure
        </button>
      </div>
    </div>
  )
} 