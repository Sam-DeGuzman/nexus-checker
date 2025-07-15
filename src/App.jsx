import USAMap from './components/USAMap.jsx'
import { useState, useEffect } from 'react'
import STATES_JSON from './utils/states.json'
import QuestionCard from './components/QuestionCard.jsx'
import nexusData from './utils/nexus.json'

function NexusCheckerApp() {
  // --- State Management ---
  const [selectedState, setSelectedState] = useState(null) // state code (e.g. 'CA')
  const [questionActive, setQuestionActive] = useState(false)
  const [userAnswers, setUserAnswers] = useState(() => {
    const saved = localStorage.getItem('userAnswers');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
  }, [userAnswers]);

  // Map state code to full name
  const codeToName = STATES_JSON.states.reduce((acc, s) => { acc[s.id] = s.name; return acc }, {})

  // --- Color Logic ---
  function determineStateColor(stateAnswers) {
    if (!stateAnswers) return 'gray';
    const allAnswers = [];
    if (stateAnswers.economic) allAnswers.push(stateAnswers.economic);
    Object.keys(stateAnswers).forEach(k => {
      if (k.startsWith('physical_')) allAnswers.push(stateAnswers[k]);
    });
    if (allAnswers.includes('yes')) return 'green';
    if (allAnswers.includes('not_sure')) return 'yellow';
    if (allAnswers.length > 0 && allAnswers.every(answer => answer === 'no')) return 'red';
    return 'gray';
  }
  const stateColors = STATES_JSON.states.reduce((acc, s) => {
    acc[s.id] = determineStateColor(userAnswers[s.id]);
    return acc;
  }, {});

  // --- Handlers ---
  function handleStateClick(stateCode) {
    // If already answered, do not show question again
    if (userAnswers[stateCode]) {
      setSelectedState(stateCode);
      setQuestionActive(false); // show summary, not question
      // Optionally scroll to summary
      // Scroll to the specific summary card for this state
      setTimeout(() => {
        const card = document.getElementById(`summary-${stateCode}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // Wait for render
      return;
    }
    setSelectedState(stateCode)
    setQuestionActive(true)
  }

  function handleAnswer(stateCode, answerObj) {
    setUserAnswers(prev => ({ ...prev, [stateCode]: answerObj }))
    setQuestionActive(false)
    setSelectedState(null)
  }

  // --- Data for QuestionCard ---
  let stateName = selectedState ? codeToName[selectedState] : null
  let stateData = stateName && nexusData[stateName] ? nexusData[stateName] : null

  // --- Render ---
  return (
    <div className="nexus-widget tw-bg-gray-50 tw-min-h-screen tw-py-10 tw-font-sans">
      {/* Instructions Card */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-md tw-p-6 tw-max-w-2xl tw-mx-4 md:tw-mx-auto tw-mb-6">
        <p className="tw-text-gray-700 tw-mb-0">Select a state where you have sales. For each state, answer the question to determine if sales tax nexus applies.</p>
      </div>
      {/* Map Card */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-md tw-p-6 tw-max-w-2xl tw-mx-4 md:tw-mx-auto tw-mb-6">
        <USAMap selectedStates={selectedState ? [selectedState] : []} handleStateClick={handleStateClick} stateColors={stateColors} />
      </div>
      {/* Question Card: show if a state is selected and question flow is active */}
      {questionActive && selectedState && stateData && stateData.question && !userAnswers[selectedState] && (
        <QuestionCard
          state={selectedState} // Pass state code, not name
          stateData={stateData}
          onAnswer={handleAnswer}
        />
      )}
      {/* If state has no question, show physical presence prompts only */}
      {questionActive && selectedState && stateData && !stateData.question && !userAnswers[selectedState] && (
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-md tw-p-6 tw-max-w-2xl tw-mx-4 md:tw-mx-auto tw-mb-6">
          <div className="tw-text-gray-800 tw-font-semibold tw-mb-2">{stateName}</div>
          <div className="tw-text-gray-700 tw-mb-4">No economic nexus threshold. Check for physical presence only:</div>
          <ul className="tw-list-disc tw-ml-6 tw-mb-4">
            {stateData.physical_prompts && stateData.physical_prompts.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
          <button
            type="button"
            className="tw-bg-blue-500 tw-text-white tw-px-6 tw-py-3 tw-rounded tw-shadow-sm tw-font-semibold tw-transition hover:tw-bg-blue-600 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-400"
            onClick={() => handleAnswer(selectedState, 'n/a')}
          >
            Close
          </button>
        </div>
      )}
      {/* Summary Card: show after answering at least one state */}
      {Object.keys(userAnswers).length > 0 && !questionActive && (
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-md tw-p-6 tw-max-w-2xl tw-mx-4 md:tw-mx-auto">
          <div className="tw-text-gray-800 tw-font-semibold tw-text-xl tw-mb-4">Summary</div>
          <div className="tw-flex tw-flex-col tw-gap-6">
            {Object.entries(userAnswers).map(([code, ansObj]) => {
              const stateName = codeToName[code];
              const stateNexus = nexusData[stateName] || {};
              // Economic logic
              let econLogic = stateNexus.logic;
              let econThreshold = [];
              if (econLogic === 'or') {
                if (stateNexus.revenue && stateNexus.txns) {
                  econThreshold.push(`$${stateNexus.revenue.toLocaleString()} in sales`);
                  econThreshold.push(`${stateNexus.txns} transactions`);
                }
              } else if (econLogic === 'and') {
                if (stateNexus.revenue && stateNexus.txns) {
                  econThreshold.push(`$${stateNexus.revenue.toLocaleString()} in sales`);
                  econThreshold.push(`${stateNexus.txns} transactions`);
                }
              } else if (econLogic === 'revenue' && stateNexus.revenue) {
                econThreshold.push(`$${stateNexus.revenue.toLocaleString()} in sales`);
              }
              // Determine overall status
              const hasEcon = ansObj.economic;
              const anyPhysicalYes = Object.entries(ansObj).some(([k, v]) => k.startsWith('physical_') && v === 'yes');
              const anyNotSure = Object.values(ansObj).includes('not_sure');
              let overallStatus = 'No Nexus';
              // Use the same color logic as the map
              const badgeColor = determineStateColor(ansObj);
              let color = '';
              if (badgeColor === 'green') color = 'tw-bg-[#22c55e] tw-text-white';
              else if (badgeColor === 'yellow') color = 'tw-bg-[#facc15] tw-text-gray-900';
              else if (badgeColor === 'red') color = 'tw-bg-[#ef4444] tw-text-white';
              else color = 'tw-bg-[#e5e7eb] tw-text-gray-800';
              let rec = 'No sales tax registration likely needed.';
              if ((hasEcon && ansObj.economic === 'yes') || anyPhysicalYes) {
                overallStatus = 'Likely Nexus';
                rec = 'You likely need to register and collect sales tax.';
              } else if (anyNotSure) {
                overallStatus = 'Possible Nexus';
                rec = 'Review your activities or consult a tax advisor.';
              }
              return (
                <div key={code} id={`summary-${code}`} className="tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-sm tw-p-4 tw-bg-gray-50">
                  <div className="tw-flex tw-items-center tw-mb-2">
                    <span className="tw-text-lg tw-font-semibold tw-mr-2">{stateName}</span>
                    <span className={`tw-inline-block tw-rounded-full tw-px-3 tw-py-1 tw-text-xs tw-font-bold tw-ml-2 ${color}`}>{overallStatus}</span>
                  </div>
                  <div className="tw-mb-2">
                    <span className="tw-font-semibold">Economic Nexus:</span>
                    {stateNexus.question ? (
                      <>
                        <span className="tw-ml-2">{stateNexus.question}</span>
                        <div className="tw-ml-4 tw-mt-1 tw-text-sm">
                          {econThreshold.length > 0 && (
                            <span>Threshold: {econThreshold.join(econLogic === 'and' ? ' AND ' : econLogic === 'or' ? ' OR ' : '')}</span>
                          )}
                        </div>
                        <div className="tw-ml-4 tw-mt-1 tw-text-sm">
                          <span className="tw-font-medium">Your answer:</span> <span>{ansObj.economic === 'yes' ? 'Yes (Threshold met)' : ansObj.economic === 'no' ? 'No (Threshold not met)' : 'Not Sure'}</span>
                        </div>
                      </>
                    ) : (
                      <span className="tw-ml-2 tw-text-gray-500">No economic nexus threshold for this state.</span>
                    )}
                  </div>
                  <div className="tw-mb-2">
                    <span className="tw-font-semibold">Physical Nexus:</span>
                    {stateNexus.physical_prompts && stateNexus.physical_prompts.length > 0 ? (
                      <ul className="tw-ml-4 tw-mt-1 tw-list-disc tw-text-sm">
                        {stateNexus.physical_prompts.map((prompt, idx) => (
                          <li key={idx}>
                            <span className="tw-font-medium">{prompt}</span>
                            {ansObj[`physical_${idx}`] && (
                              <span className="tw-ml-2">— <span className="tw-font-medium">Your answer:</span> {ansObj[`physical_${idx}`] === 'yes' ? 'Yes (Physical presence)' : ansObj[`physical_${idx}`] === 'no' ? 'No' : 'Not Sure'}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="tw-ml-2 tw-text-gray-500">No physical presence questions for this state.</span>
                    )}
                  </div>
                  <div className="tw-mt-2 tw-p-3 tw-bg-gray-100 tw-rounded">
                    <span className="tw-font-semibold">Recommendation:</span> {rec}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="tw-text-gray-500 tw-mt-6 tw-text-center tw-font-medium">Thank you for using the Nexus Checker!</div>
        </div>
      )}
    </div>
  )
}

// Error Boundary wrapper
import { Component } from 'react'
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch() {
    // Log error if needed
  }
  render() {
    if (this.state.hasError) {
      return <div className="tw-text-red-700 tw-p-4">Something went wrong in the widget.</div>
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <NexusCheckerApp />
    </ErrorBoundary>
  )
}
