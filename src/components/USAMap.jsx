import React, { useRef, useState, useCallback, useEffect } from 'react'
import STATES_JSON from '../utils/states.json'

const ZOOM_LEVELS = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const TRANSITION_MS = 250;
const MAP_WIDTH = 959;
const MAP_HEIGHT = 593;

export default function USAMap() {
  const STATES_SVG_ARR = STATES_JSON.states;

  // --- ZOOM & PAN STATE (viewBox only) ---
  const [zoom, setZoom] = useState(1);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 }); // in client coords
  const [lastViewBox, setLastViewBox] = useState({ x: 0, y: 0 }); // for pan start
  const [transition, setTransition] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const svgContainerRef = useRef(null);
  const zoomRef = useRef(zoom);
  const viewBoxRef = useRef(viewBox);
  const lastTouchDistance = useRef(null);
  const lastTouchCenter = useRef(null);
  // Add refs to store initial pinch state
  const initialPinchCenter = useRef(null);
  const initialPinchZoom = useRef(null);

  // --- UTILS ---
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  // --- VIEWBOX HELPERS ---
  // Update getViewBoxForZoom to return the actual center after clamping
  const getViewBoxForZoom = (zoom, center = null) => {
    const width = MAP_WIDTH / zoom;
    const height = MAP_HEIGHT / zoom;
    let x = 0, y = 0;
    if (center) {
      x = clamp(center.x - width / 2, 0, MAP_WIDTH - width);
      y = clamp(center.y - height / 2, 0, MAP_HEIGHT - height);
      // Recalculate actual center after clamping
      const actualCenter = {
        x: x + width / 2,
        y: y + height / 2
      };
      return { x, y, width, height, actualCenter };
    } else {
      // Center on map center
      x = (MAP_WIDTH - width) / 2;
      y = (MAP_HEIGHT - height) / 2;
      return { x, y, width, height, actualCenter: { x: x + width / 2, y: y + height / 2 } };
    }
  };

  // --- ZOOM HANDLERS ---
  // Update setZoomLevel to use the actual center for subsequent zooms
  const setZoomLevel = useCallback((newZoom, focusSvgPoint = null) => {
    newZoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
    if (newZoom === zoomRef.current) return;
    let newViewBoxObj;
    if (focusSvgPoint && newZoom > 1) {
      newViewBoxObj = getViewBoxForZoom(newZoom, focusSvgPoint);
    } else {
      newViewBoxObj = getViewBoxForZoom(newZoom, null);
    }
    const { x, y, width, height, actualCenter } = newViewBoxObj;
    setTransition(true);
    setZoom(newZoom);
    setViewBox({ x, y, width, height });
    zoomRef.current = newZoom;
    viewBoxRef.current = { x, y, width, height };
    // Store the actual center for next zoom
    setLastViewBoxCenter(actualCenter);
  }, []);

  // Add state for lastViewBoxCenter
  const [lastViewBoxCenter, setLastViewBoxCenter] = useState({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });

  const zoomIn = useCallback(() => {
    const idx = ZOOM_LEVELS.findIndex(z => z > zoomRef.current);
    if (idx !== -1) {
      setZoomLevel(ZOOM_LEVELS[idx], lastViewBoxCenter);
    }
  }, [setZoomLevel, lastViewBoxCenter]);

  const zoomOut = useCallback(() => {
    const idx = ZOOM_LEVELS.slice().reverse().findIndex(z => z < zoomRef.current);
    if (idx !== -1) {
      setZoomLevel(ZOOM_LEVELS[ZOOM_LEVELS.length - 1 - idx], lastViewBoxCenter);
    }
  }, [setZoomLevel, lastViewBoxCenter]);

  const resetZoom = useCallback(() => {
    setTransition(true);
    setZoom(1);
    const centeredViewBox = getViewBoxForZoom(1, null);
    setViewBox(centeredViewBox);
    zoomRef.current = 1;
    viewBoxRef.current = centeredViewBox;
  }, []);

  // --- PAN HANDLERS (viewBox x/y) ---
  function boundsCheckViewBox(x, y, width, height) {
    return {
      x: clamp(x, 0, MAP_WIDTH - width),
      y: clamp(y, 0, MAP_HEIGHT - height),
    };
  }

  const startPan = (clientX, clientY) => {
    setIsPanning(true);
    setLastPan({ x: clientX, y: clientY });
    setLastViewBox({ x: viewBoxRef.current.x, y: viewBoxRef.current.y });
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
      const container = svgContainerRef.current;
      const rect = container.getBoundingClientRect();
      const dx = (clientX - lastPan.x) * (viewBoxRef.current.width / rect.width);
      const dy = (clientY - lastPan.y) * (viewBoxRef.current.height / rect.height);
      let newX = lastViewBox.x - dx;
      let newY = lastViewBox.y - dy;
      const bounded = boundsCheckViewBox(newX, newY, viewBoxRef.current.width, viewBoxRef.current.height);
      setViewBox(vb => ({ ...vb, ...bounded }));
      viewBoxRef.current = { ...viewBoxRef.current, ...bounded };
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
    const container = svgContainerRef.current;
    const rect = container.getBoundingClientRect();
    const x = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
    const y = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;
    const svgX = viewBoxRef.current.x + (x / rect.width) * viewBoxRef.current.width;
    const svgY = viewBoxRef.current.y + (y / rect.height) * viewBoxRef.current.height;
    return { x: svgX, y: svgY };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastTouchDistance.current = getTouchDistance(e.touches);
      // Record the initial center and zoom for stable pinch
      initialPinchCenter.current = getTouchCenter(e.touches);
      initialPinchZoom.current = zoomRef.current;
    } else if (e.touches.length === 1 && zoomRef.current > 1) {
      startPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      if (lastTouchDistance.current && initialPinchCenter.current && initialPinchZoom.current) {
        const scale = dist / lastTouchDistance.current;
        let newZoom = clamp(initialPinchZoom.current * scale, MIN_ZOOM, MAX_ZOOM);
        let nearest = ZOOM_LEVELS.reduce((prev, curr) => Math.abs(curr - newZoom) < Math.abs(prev - newZoom) ? curr : prev);
        setZoomLevel(nearest, initialPinchCenter.current);
      }
      // Do not update initialPinchCenter/Zoom during move
      // Only update lastTouchDistance for next move
      lastTouchDistance.current = dist;
    } else if (e.touches.length === 1 && isPanning) {
      handlePointerMove(e);
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
    initialPinchCenter.current = null;
    initialPinchZoom.current = null;
    setIsPanning(false);
    setTransition(true);
  };

  // --- DOUBLE TAP TO ZOOM ---
  // Remove handleDoubleTap and its usage

  // --- WHEEL ZOOM (desktop) ---
  const handleWheel = (e) => {
    if (!svgContainerRef.current) return;
    if (e.ctrlKey) return;
    e.preventDefault();
    setTransition(true);
    // Only needed for zooming out now
    if (e.deltaY < 0) {
      zoomIn();
    } else if (e.deltaY > 0) {
      const idx = ZOOM_LEVELS.slice().reverse().findIndex(z => z < zoomRef.current);
      if (idx !== -1) {
        // Use current viewBox center as focus point for zooming out
        const vb = viewBoxRef.current;
        const center = { x: vb.x + vb.width / 2, y: vb.y + vb.height / 2 };
        setZoomLevel(ZOOM_LEVELS[ZOOM_LEVELS.length - 1 - idx], center);
      }
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
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  // Update viewBox effect to keep lastViewBoxCenter in sync
  useEffect(() => {
    setLastViewBoxCenter({ x: viewBox.x + viewBox.width / 2, y: viewBox.y + viewBox.height / 2 });
  }, [viewBox]);

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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
    >
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="usa-map-svg tw-w-full tw-h-full tw-block"
        xmlns="http://www.w3.org/2000/svg"
        aria-labelledby="usa-map-title"
        focusable="false"
        style={{
          transition: transition ? `all ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1)` : 'none',
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
                    strokeWidth="0.8"
                    style={{ cursor: 'pointer', outline: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
                    tabIndex={0}
                    aria-label="District of Columbia"
                    onClick={() => { alert('DC clicked!'); }}
                    className="tw-cursor-pointer tw-transition-colors tw-duration-200 tw-ease-in-out tw-fill-gray-200 hover:tw-fill-blue-500 focus:tw-fill-blue-500 active:tw-fill-blue-500"
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