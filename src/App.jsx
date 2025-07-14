import USAMap from './components/USAMap.jsx'

function NexusCheckerApp() {
  return (
    <div className="nexus-widget tw-bg-gray-50 tw-min-h-screen tw-py-10 tw-font-sans">
      {/* Instructions Card */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-md tw-p-6 tw-max-w-2xl tw-mx-4 md:tw-mx-auto tw-mb-6">
        <p className="tw-text-gray-700 tw-mb-0">Select the states where you have sales. For each state, answer the question to determine if sales tax nexus applies.</p>
      </div>
      {/* Map Card */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-md tw-p-6 tw-max-w-2xl tw-mx-4 md:tw-mx-auto tw-mb-6">
        {/* US Map */}
        <USAMap />
      </div>
      {/* State Question Card */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-md tw-p-6 tw-max-w-2xl tw-mx-4 md:tw-mx-auto tw-mb-6">
        {/* Placeholder for State Question */}
        <div className="tw-text-gray-800 tw-font-semibold tw-mb-2">California</div>
        <div className="tw-text-gray-700 tw-mb-4">Have you made more than $500,000 in sales in California?</div>
        <div className="tw-flex tw-gap-6">
          <label className="tw-flex tw-items-center tw-gap-2">
            <input type="radio" name="ca-sales" value="yes" disabled />
            Yes
          </label>
          <label className="tw-flex tw-items-center tw-gap-2">
            <input type="radio" name="ca-sales" value="no" disabled />
            No
          </label>
        </div>
      </div>
      {/* Summary Card */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-md tw-p-6 tw-max-w-2xl tw-mx-4 md:tw-mx-auto">
        <div className="tw-text-gray-800 tw-font-semibold tw-mb-2">Summary</div>
        <div className="tw-text-gray-500">[Summary placeholder]</div>
      </div>
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
