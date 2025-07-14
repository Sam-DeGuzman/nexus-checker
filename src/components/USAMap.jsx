import React, { useRef, useState, useCallback, useEffect } from 'react'
import STATES_JSON from '../utils/states.json'

const ZOOM_LEVELS = [1, 1.5, 2, 2.5];
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;
const TRANSITION_MS = 250;

export default function USAMap() {
  const STATES_SVG_ARR = STATES_JSON.states;

  // --- ZOOM & PAN STATE ---
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const [transition, setTransition] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const svgContainerRef = useRef(null);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const lastTouchDistance = useRef(null);
  const lastTouchCenter = useRef(null);
  const lastTap = useRef(0);

  // --- BOUNDS ---
  const MAP_WIDTH = 959;
  const MAP_HEIGHT = 593;

  // --- UTILS ---
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  // --- ZOOM HANDLERS ---
  const setZoomLevel = useCallback((newZoom, center = null) => {
    newZoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
    if (newZoom === zoomRef.current) return;
    // Center zoom on a point if provided
    if (center && newZoom > 1) {
      // Calculate new pan so that the center point stays under the cursor
      const rect = svgContainerRef.current.getBoundingClientRect();
      const cx = center.x - rect.left;
      const cy = center.y - rect.top;
      const scale = newZoom / zoomRef.current;
      const newPanX = (panRef.current.x - cx) * scale + cx;
      const newPanY = (panRef.current.y - cy) * scale + cy;
      setPan(boundsCheck({ x: newPanX, y: newPanY }, newZoom));
    } else if (newZoom === 1) {
      setPan({ x: 0, y: 0 });
    }
    setTransition(true);
    setZoom(newZoom);
    zoomRef.current = newZoom;
  }, []);

  const zoomIn = useCallback(() => {
    const idx = ZOOM_LEVELS.findIndex(z => z > zoomRef.current);
    if (idx !== -1) setZoomLevel(ZOOM_LEVELS[idx]);
  }, [setZoomLevel]);

  const zoomOut = useCallback(() => {
    const idx = ZOOM_LEVELS.slice().reverse().findIndex(z => z < zoomRef.current);
    if (idx !== -1) setZoomLevel(ZOOM_LEVELS[ZOOM_LEVELS.length - 1 - idx]);
  }, [setZoomLevel]);

  const resetZoom = useCallback(() => {
    setTransition(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
  }, []);

  // --- PAN HANDLERS ---
  function boundsCheck(pan, zoom) {
    // Prevent panning outside the map
    const container = svgContainerRef.current;
    if (!container) return pan;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const maxX = (zoom - 1) * w / 2;
    const maxY = (zoom - 1) * h / 2;
    return {
      x: clamp(pan.x, -maxX, maxX),
      y: clamp(pan.y, -maxY, maxY),
    };
  }

  const startPan = (clientX, clientY) => {
    setIsPanning(true);
    setLastPan({ x: clientX - panRef.current.x, y: clientY - panRef.current.y });
    setTransition(false);
  };

  const handlePointerDown = (e) => {
    if (zoomRef.current === 1) return;
    if (e.touches && e.touches.length === 1) {
      startPan(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.button === 0) {
      startPan(e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e) => {
    if (!isPanning) return;
    let clientX, clientY;
    if (e.touches && e.touches.length === 1) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    requestAnimationFrame(() => {
      const newPan = {
        x: clientX - lastPan.x,
        y: clientY - lastPan.y,
      };
      setPan(boundsCheck(newPan, zoomRef.current));
      panRef.current = boundsCheck(newPan, zoomRef.current);
    });
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setTransition(true);
  };

  // --- TOUCH GESTURES ---
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  const getTouchCenter = (touches) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
    } else if (e.touches.length === 1 && zoomRef.current > 1) {
      startPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      const dist = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      if (lastTouchDistance.current) {
        const scale = dist / lastTouchDistance.current;
        let newZoom = clamp(zoomRef.current * scale, MIN_ZOOM, MAX_ZOOM);
        setZoomLevel(newZoom, center);
      }
      lastTouchDistance.current = dist;
      lastTouchCenter.current = center;
    } else if (e.touches.length === 1 && isPanning) {
      handlePointerMove(e);
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
    setIsPanning(false);
    setTransition(true);
  };

  // --- DOUBLE TAP TO ZOOM ---
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      zoomIn();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  // --- WHEEL ZOOM (desktop) ---
  const handleWheel = (e) => {
    if (!svgContainerRef.current) return;
    if (e.ctrlKey) return; // let browser handle pinch-zoom
    e.preventDefault();
    setTransition(true);
    if (e.deltaY < 0) {
      zoomIn();
    } else if (e.deltaY > 0) {
      zoomOut();
    }
  };

  // --- PREVENT PAGE SCROLL DURING MAP INTERACTIONS ---
  useEffect(() => {
    const preventScroll = (event) => {
      if (isPanning || zoomRef.current > 1) {
        event.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => document.removeEventListener('touchmove', preventScroll);
  }, [isPanning]);

  // --- UPDATE REFS ON STATE CHANGE ---
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // --- HIDE CONTROLS ON MOBILE WHEN NOT ZOOMED ---
  useEffect(() => {
    if (zoom === 1) {
      setShowControls(true);
    }
  }, [zoom]);

  // --- RENDER ---
  return (
    <div
      ref={svgContainerRef}
      className="tw-w-full tw-h-full tw-aspect-[959/593] tw-overflow-hidden tw-relative tw-touch-none"
      role="region"
      aria-label="Map of the United States"
      tabIndex={0}
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={e => { handleTouchStart(e); handleDoubleTap(); }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
    >
      <svg
        viewBox="0 0 959 593"
        className="usa-map-svg tw-w-full tw-h-full tw-block"
        xmlns="http://www.w3.org/2000/svg"
        aria-labelledby="usa-map-title"
        focusable="false"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale3d(${zoom}, ${zoom}, 1)` ,
          transition: transition ? `transform ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1)` : 'none',
          touchAction: 'none',
          willChange: 'transform',
        }}
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
      {/* --- ZOOM CONTROLS --- */}
      {showControls && (
        <div
          className="tw-absolute tw-z-10 tw-flex tw-flex-col tw-items-center tw-bg-white/80 tw-rounded-xl tw-shadow-lg tw-p-1 tw-gap-1 sm:tw-gap-2 lg:tw-gap-3 tw-bottom-2 sm:tw-bottom-4 lg:tw-bottom-6 tw-right-2 sm:tw-right-4 lg:tw-right-6"
          style={{ touchAction: 'none', userSelect: 'none' }}
          aria-label="Map zoom controls"
        >
          <button
            className="tw-w-8 tw-h-8 sm:tw-w-10 sm:tw-h-10 lg:tw-w-12 lg:tw-h-12 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-white tw-shadow tw-border tw-border-gray-300 tw-text-xl tw-font-bold tw-cursor-pointer tw-transition hover:tw-bg-blue-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-400 disabled:tw-opacity-50"
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            tabIndex={0}
            type="button"
          >
            +
          </button>
          <button
            className="tw-w-8 tw-h-8 sm:tw-w-10 sm:tw-h-10 lg:tw-w-12 lg:tw-h-12 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-white tw-shadow tw-border tw-border-gray-300 tw-text-xl tw-font-bold tw-cursor-pointer tw-transition hover:tw-bg-blue-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-400 disabled:tw-opacity-50"
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            tabIndex={0}
            type="button"
          >
            –
          </button>
          <button
            className="tw-w-8 tw-h-8 sm:tw-w-10 sm:tw-h-10 lg:tw-w-12 lg:tw-h-12 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-white tw-shadow tw-border tw-border-gray-300 tw-text-base tw-font-bold tw-cursor-pointer tw-transition hover:tw-bg-blue-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-400"
            aria-label="Reset zoom"
            onClick={resetZoom}
            tabIndex={0}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4V1L5 6l5 5V7c2.76 0 5 2.24 5 5a5 5 0 1 1-10 0" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}
// ---
// Path data sourced from: https://commons.wikimedia.org/wiki/File:Blank_US_Map_(states_only).svg (CC0) 