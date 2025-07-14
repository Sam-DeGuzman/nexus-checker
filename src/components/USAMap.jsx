import React from 'react'
import STATES_JSON from '../utils/states.json'

export default function USAMap() {

  const STATES_SVG_ARR = STATES_JSON.states;

  return (
    <div
      className="tw-w-full tw-h-full tw-aspect-[959/593] tw-overflow-hidden"
      role="region"
      aria-label="Map of the United States"
    >
      <svg
        viewBox="0 0 959 593"
        className="usa-map-svg tw-w-full tw-h-full tw-block"
        xmlns="http://www.w3.org/2000/svg"
        aria-labelledby="usa-map-title"
        focusable="false"
      >
        <g>
          {STATES_SVG_ARR.map((state) => {
            // Extract the first coordinate from the path data (e.g., 'm 643,467.4 ...' or 'M 139.6,387.6 ...')
            const match = state.d.match(/[mM]\s*(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
            const x = match ? parseFloat(match[1]) : 0;
            const y = match ? parseFloat(match[2]) : 0;
            // Special rendering for DC
            if (state.id === "DC") {
              return (
                <React.Fragment key={state.id}>
                  <circle
                    cx={state.x ? state.x : x}
                    cy={state.y ? state.y : y}
                    r={8} // Smaller size
                    fill="#e5e7eb" 
                    stroke="#1e293b" // slate-800
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    aria-label="District of Columbia"
                    onClick={() => { alert('DC clicked!'); }}
                  className="tw-cursor-pointer tw-transition-colors tw-duration-200 tw-ease-in-out tw-fill-gray-200 tw-stroke-gray-400 tw-stroke-[0.8] hover:tw-fill-blue-500 focus:tw-fill-blue-500 active:tw-fill-blue-500"
                    onKeyPress={(e) => { if (e.key === 'Enter') { alert('DC clicked!'); } }}
                  >
                  <title>{state.name}</title>
                  </circle>
                  <text
                    x={state.x ? state.x : x}
                    y={(state.y ? state.y : y) + 1}
                    fontSize="7" // Smaller text
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#1e293b"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    DC
                  </text>
                </React.Fragment>
              );
            }
            // Default rendering for other states
            return (
              <React.Fragment key={state.id}>
                <path
                  key={state.id}
                  id={state.id}
                  d={state.d}
                  style={{
                    cursor: 'pointer',
                  }}
                  aria-label={state.name}
                  className="tw-cursor-pointer tw-transition-colors tw-duration-200 tw-ease-in-out tw-fill-gray-200 tw-stroke-gray-400 tw-stroke-[0.8] hover:tw-fill-blue-500 focus:tw-fill-blue-500 active:tw-fill-blue-500"
                  fill="#e5e7eb" // fallback for gray-200
                  stroke="blue" // fallback for gray-400
                  strokeWidth="0.8" // fallback for tw-stroke-[0.8] 
                >
                  <title>{state.name}</title>
                </path>
                <text
                  x={state.x ? state.x : x}
                  y={state.y ? state.y : y}
                  fontSize={state.id === "MD" || state.id === "NJ" || state.id === "DE" ? "7" : "10"}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill="#1e293b"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {state.id}
                </text>
              </React.Fragment>
            );
          })}
        </g>
      </svg>
    </div>
  )
}

// ---
// Path data sourced from: https://commons.wikimedia.org/wiki/File:Blank_US_Map_(states_only).svg (CC0) 