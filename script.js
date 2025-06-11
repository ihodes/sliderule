const CONFIG = {
  SCALE_LENGTH_MULTIPLIER: 1.5,
  SCALE_WIDTH: 600 * 1.5,
  SLOT_HEIGHT: 40,  // Height of each scale slot
  BUFFER_SPACE: 30,
  BODY_PADDING: 0,  // No padding since we removed body formatting
  // Define number of scale slots for each component
  SCALE_SLOTS: {
    upperStator: 1,  // A scale
    slide: 2,        // B and C scales
    lowerStator: 1   // D scale
  }
};

// Calculate component heights based on slots
CONFIG.UPPER_STATOR_HEIGHT = CONFIG.SCALE_SLOTS.upperStator * CONFIG.SLOT_HEIGHT || 40; // Min 40px for visual
CONFIG.SLIDE_HEIGHT = CONFIG.SCALE_SLOTS.slide * CONFIG.SLOT_HEIGHT;
CONFIG.LOWER_STATOR_HEIGHT = CONFIG.SCALE_SLOTS.lowerStator * CONFIG.SLOT_HEIGHT;
CONFIG.EFFECTIVE_WIDTH = CONFIG.SCALE_WIDTH - 2 * CONFIG.BUFFER_SPACE;

// Calculate total slide rule height for cursor
CONFIG.TOTAL_HEIGHT = CONFIG.UPPER_STATOR_HEIGHT + CONFIG.SLIDE_HEIGHT + CONFIG.LOWER_STATOR_HEIGHT;

// -------------------------------------------
// CANVAS SETUP FUNCTIONS
// -------------------------------------------

/**
 * Initialize a canvas with proper dimensions and DPI scaling
 * @param {string} canvasId - The ID of the canvas element
 * @param {number} width - Canvas width in CSS pixels
 * @param {number} height - Canvas height in CSS pixels
 * @returns {Object} Object containing canvas, context, and dimensions
 */
function setupCanvas(canvasId, width, height) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas size (accounting for device pixel ratio)
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Set display size (CSS pixels)
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr);

    return {
        canvas,
        ctx,
        width,
        height
    };
}

/**
 * Initialize all canvases for the slide rule
 * @returns {Object} Object containing all canvas configurations
 */
function initializeSlideRuleCanvases() {
    return {
        upperStator: setupCanvas('upper-stator-canvas', CONFIG.SCALE_WIDTH, CONFIG.UPPER_STATOR_HEIGHT),
        slide: setupCanvas('slide-canvas', CONFIG.SCALE_WIDTH, CONFIG.SLIDE_HEIGHT),
        lowerStator: setupCanvas('lower-stator-canvas', CONFIG.SCALE_WIDTH, CONFIG.LOWER_STATOR_HEIGHT)
    };
}

// Initialize canvases for the slide rule
const canvases = initializeSlideRuleCanvases();

// Get slide rule elements
const body = document.getElementById('body');
const slide = document.getElementById('slide');
const upperStator = document.getElementById('upper-stator');
const lowerStator = document.getElementById('lower-stator');

// Apply styles from config
body.style.width = CONFIG.SCALE_WIDTH + 'px';
slide.style.height = CONFIG.SLIDE_HEIGHT + 'px';
upperStator.style.height = CONFIG.UPPER_STATOR_HEIGHT + 'px';
lowerStator.style.height = CONFIG.LOWER_STATOR_HEIGHT + 'px';

// -------------------------------------------
// SCALE DIVISIONS: Canonical registry
// Defines subdivisions by divisor, with default appearance
// -------------------------------------------
const ScaleDivisions = {
    // 0.5 spacing
    seconds:        { divisor: 2,   defaultHeight: 12, defaultWidth: 1.0,  minPixelSpacing: 15  },
    // 0.2 spacing
    fifths:         { divisor: 5,   defaultHeight: 8,  defaultWidth: 0.6,  minPixelSpacing: 8   },
    // 0.1 spacing
    tenths:         { divisor: 10,  defaultHeight: 10, defaultWidth: 0.8,  minPixelSpacing: 5   },
    // 0.05 spacing
    twentieths:     { divisor: 20,  defaultHeight: 7,  defaultWidth: 0.5,  minPixelSpacing: 3   },
    // 0.02 spacing
    fiftieths:      { divisor: 50,  defaultHeight: 6,  defaultWidth: 0.4,  minPixelSpacing: 2   },
    // 0.01 spacing
    hundredths:     { divisor: 100, defaultHeight: 4,  defaultWidth: 0.3,  minPixelSpacing: 1.5 },
    // 0.005 spacing
    twoHundredths:  { divisor: 200, defaultHeight: 3,  defaultWidth: 0.25, minPixelSpacing: 1   },
    // 0.002 spacing
    fiveHundredths: { divisor: 500, defaultHeight: 3,  defaultWidth: 0.2,  minPixelSpacing: 0.8 }
};

// -------------------------------------------
// DIVISION RULES: Define tick patterns for different scale ranges
// -------------------------------------------
const DivisionRuleSets = {
    // Standard single-decade logarithmic scale divisions
    singleDecadeLog: [
        { range: [1, 1.5], divisions: ['seconds', 'tenths', 'twentieths', 'hundredths'] },
        { range: [1.5, 2], divisions: ['seconds', 'tenths', 'twentieths', 'hundredths'] },
        { range: [2, 3], divisions: ['seconds', 'tenths', 'fiftieths'] },
        { range: [3, 4], divisions: ['seconds', 'tenths', 'fiftieths'] },
        { range: [4, 5], divisions: ['seconds', 'tenths', 'twentieths'] },
        { range: [5, 6], divisions: ['seconds', 'tenths', 'twentieths'] },
        { range: [6, 7], divisions: ['seconds', 'tenths', 'twentieths'] },
        { range: [7, 8], divisions: ['seconds', 'tenths', 'twentieths'] },
        { range: [8, 9], divisions: ['seconds', 'tenths'] },
        { range: [9, 10], divisions: ['seconds', 'tenths'] }
    ],
    // Two-decade logarithmic scale divisions (1-100)
    twoDecadeLog: [
        // First decade (1-10)
        { range: [1, 1.5], divisions: ['seconds', 'tenths', 'twentieths', 'hundredths'] },
        { range: [1.5, 2], divisions: ['seconds', 'tenths', 'twentieths', 'hundredths'] },
        { range: [2, 3], divisions: ['seconds', 'tenths', 'fiftieths'] },
        { range: [3, 4], divisions: ['seconds', 'tenths', 'fiftieths'] },
        { range: [4, 5], divisions: ['seconds', 'tenths', 'twentieths'] },
        { range: [5, 6], divisions: ['seconds', 'tenths', 'twentieths'] },
        { range: [6, 7], divisions: ['seconds', 'tenths'] },
        { range: [7, 8], divisions: ['seconds', 'tenths'] },
        { range: [8, 9], divisions: ['seconds'] },
        { range: [9, 10], divisions: ['seconds'] },
        // Second decade (10-100) - less detail
        { range: [10, 15], divisions: ['tenths'] },
        { range: [15, 20], divisions: ['tenths'] },
        { range: [20, 30], divisions: ['seconds'] },
        { range: [30, 40], divisions: ['seconds'] },
        { range: [40, 50], divisions: ['seconds'] },
        { range: [50, 60], divisions: ['seconds'] },
        { range: [60, 70], divisions: ['seconds'] },
        { range: [70, 80], divisions: ['seconds'] },
        { range: [80, 90], divisions: ['seconds'] },
        { range: [90, 100], divisions: ['seconds'] }
    ]
};

// -------------------------------------------
// SCALE DEFINITION: Pure data/mathematical representation
// -------------------------------------------
class Scale {
    constructor(options) {
        this.type = options.type || 'logarithmic'; // 'logarithmic' or 'linear'
        this.leftIndex = options.leftIndex || 1;
        this.rightIndex = options.rightIndex || 10;
        this.divisionRules = options.divisionRules || null;
    }

    // Convert value to normalized position (0-1)
    valueToNormalizedPosition(value) {
        if (this.type === 'logarithmic') {
            const logRange = Math.log10(this.rightIndex / this.leftIndex);
            return Math.log10(value / this.leftIndex) / logRange;
        } else if (this.type === 'linear') {
            return (value - this.leftIndex) / (this.rightIndex - this.leftIndex);
        } else {
            console.error("Scale type '", this.type, "' is not supported.")
        }
    }

}

// -------------------------------------------
// TICK SELECTOR: Returns all divisions specified in the given rules for a given range [x1, x2].
// -------------------------------------------
function selectDivisions(divisionRules, range) {
    const [rangeStart, rangeEnd] = range;

    // Find applicable division rules for this range
    const applicableRule = divisionRules.find(rule =>
        rangeStart >= rule.range[0] && rangeEnd <= rule.range[1]
    ) || { divisions: ['tenths'] }; // Default fallback

    // Return all divisions without filtering
    const selectedDivisions = [];

    applicableRule.divisions.forEach(divName => {
      const division = ScaleDivisions[divName];
      if (!division) {
        console.error("ScaleDivision of type '", division, "' doesn't exist.")
        return;
      }

      selectedDivisions.push({
        name: divName,
        ...division
      });
    });

    return selectedDivisions;
}

// Special mathematical constants
const MathConstants = {
    'pi': Math.PI,
    'π': Math.PI,
    'e': Math.E,
    'phi': (1 + Math.sqrt(5)) / 2,
    'φ': (1 + Math.sqrt(5)) / 2,
    'sqrt2': Math.sqrt(2),
    '√2': Math.sqrt(2),
    'sqrt3': Math.sqrt(3),
    '√3': Math.sqrt(3)
};

// -------------------------------------------
// SCALE RENDERER: Handles all visual representation
// -------------------------------------------
class ScaleRenderer {
    constructor(ctx, pixelWidth, pixelHeight, bufferSpace, options = {}) {
        this.ctx = ctx;
        this.pixelWidth = pixelWidth;
        this.pixelHeight = pixelHeight;
        this.bufferSpace = bufferSpace;
        this.effectiveWidth = pixelWidth - 2 * bufferSpace;

        // Rendering options
        this.name = options.name || 'Scale'; // Scale name for display
        this.slot = options.slot || 0; // Which slot to render in (0-based)
        this.orientation = options.orientation || 'bottom'; // 'top' or 'bottom' within the slot
        this.marks = options.marks || 'auto';
        this.specialMarks = options.specialMarks || [];
        this.divisionRules = options.divisionRules || DivisionRuleSets.singleDecadeLog;
        this.reversed = options.reversed || false; // Whether to reverse the scale direction
    }

    // Convert normalized position to pixel position
    normalizedToPixel(normalizedPos) {
        // Apply reversal if needed
        const effectivePos = this.reversed ? (1 - normalizedPos) : normalizedPos;
        return this.bufferSpace + effectivePos * this.effectiveWidth;
    }

    // Render a complete scale
    render(scale, clearCanvas = true) {
        if (clearCanvas) {
            this.ctx.clearRect(0, 0, this.pixelWidth, this.pixelHeight);
        }

        this.ctx.save(); // Save context state
        // Calculate slot position
        const slotY = this.slot * CONFIG.SLOT_HEIGHT;
        this.ctx.translate(0, slotY); // Translate to slot position

        this.ctx.strokeStyle = '#3a2a1a';
        this.ctx.fillStyle = '#3a2a1a';
        this.ctx.font = '12px Georgia';

        const growFromBottom = this.orientation === 'bottom';
        // Position within the slot
        const scaleY = growFromBottom ? CONFIG.SLOT_HEIGHT : 0;

        // Draw scale border
        this.ctx.beginPath();
        this.ctx.moveTo(0, scaleY);
        this.ctx.lineTo(this.pixelWidth, scaleY);
        this.ctx.stroke();

        // Draw ticks for each range
        this.renderTicks(scale, growFromBottom);

        // Draw marks
        this.renderMarks(scale, growFromBottom);

        // Draw special marks
        this.renderSpecialMarks(scale, growFromBottom);

        this.ctx.restore(); // Restore context state
    }

    renderTicks(scale, growFromBottom) {
        // Keep track of drawn positions to avoid overlaps
        const drawnPositions = new Set();

        // Process each division rule range
        this.divisionRules.forEach(rule => {
            const [rangeStart, rangeEnd] = rule.range;

            // Get appropriate divisions for this range
            const divisions = selectDivisions(this.divisionRules, rule.range);

            // Render ticks for each division type
            divisions.forEach(division => {
                const rangeWidth = rangeEnd - rangeStart;

                // For multi-decade scales, interpret divisions differently
                let numSteps;
                if (rangeStart >= 10 && division.name === 'tenths') {
                    // 'tenths' in range [10,20] means 10, 11, 12, ..., 20 (step by 1)
                    numSteps = rangeWidth;
                } else if (rangeStart >= 10 && division.name === 'seconds') {
                    // 'seconds' in range [20,30] means 20, 25, 30 (step by 5)
                    numSteps = rangeWidth / 5;
                } else {
                    // Normal interpretation for first decade
                    numSteps = Math.floor(rangeWidth * division.divisor);
                }

                const step = rangeWidth / numSteps;

                // Generate tick positions within this range
                for (let i = 0; i <= numSteps; i++) {
                    const value = rangeStart + i * step;

                    // Skip if outside scale bounds
                    if (value > scale.rightIndex || value < scale.leftIndex) continue;

                    // Skip if this is a mark position (will be drawn by renderMarks)
                    const marks = this.generateMarks(scale);
                    const isMark = marks.some(mark =>
                        Math.abs(mark.value - value) < 0.001
                    );
                    if (isMark) continue;

                    // Also skip if this is a special mark
                    const isSpecial = this.specialMarks.some(mark =>
                        Math.abs(mark.value - value) < 0.001
                    );
                    if (isSpecial) continue;

                    const normalizedPos = scale.valueToNormalizedPosition(value);
                    const x = Math.round(this.normalizedToPixel(normalizedPos));

                    // Skip if we've already drawn a tick at this position
                    const posKey = `${x}-${division.name}`;
                    if (drawnPositions.has(posKey)) continue;
                    drawnPositions.add(posKey);

                    // Use default height and width
                    const height = division.defaultHeight;
                    const width = division.defaultWidth;

                    this.drawTick(x, height, width, growFromBottom);
                }
            });
        });
    }

    generateMarks(scale) {
        // Generate marks based on scale type and range
        if (this.marks === 'auto') {
            // Auto-generate marks based on scale type and range
            const marks = [];
            if (scale.type === 'logarithmic') {
                // For logarithmic scales, generate standard marks
                if (scale.rightIndex / scale.leftIndex === 10) {
                    // Single decade
                    const standardMarks = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10];
                    standardMarks.forEach(val => {
                        if (val >= scale.leftIndex && val <= scale.rightIndex) {
                            marks.push({ value: val, text: String(val) });
                        }
                    });
                } else {
                    // Multi-decade - generate powers of 10 and some intermediate values
                    let decade = Math.floor(Math.log10(scale.leftIndex));
                    const endDecade = Math.ceil(Math.log10(scale.rightIndex));

                    while (decade <= endDecade) {
                        const base = Math.pow(10, decade);
                        [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(mult => {
                            const val = base * mult;
                            if (val >= scale.leftIndex && val <= scale.rightIndex) {
                                marks.push({ value: val, text: String(val) });
                            }
                        });
                        decade++;
                    }
                }
            } else {
                // Linear scale - generate evenly spaced marks
                const step = (scale.rightIndex - scale.leftIndex) / 10;
                for (let i = 0; i <= 10; i++) {
                    const val = scale.leftIndex + i * step;
                    marks.push({ value: val, text: String(val) });
                }
            }
            return marks;
        } else if (Array.isArray(this.marks)) {
            // Use provided mark values
            return this.marks.map(val => {
                // Check if this is a special constant
                let text = String(val);
                if (typeof val === 'string' && MathConstants[val] !== undefined) {
                    return { value: MathConstants[val], text: val };
                }
                return { value: val, text: text };
            });
        } else {
            return [];
        }
    }

    renderMarks(scale, growFromBottom) {
        const marks = this.generateMarks(scale);

        marks.forEach(mark => {
            const normalizedPos = scale.valueToNormalizedPosition(mark.value);
            const x = this.normalizedToPixel(normalizedPos);

            // Check for index marks (thicker lines)
            const isIndex = mark.value === scale.leftIndex || mark.value === scale.rightIndex;

            this.drawTick(x, 15, isIndex ? 2 : 1, growFromBottom);
            this.drawLabel(x, mark.text, 15, growFromBottom);
        });
    }

    renderSpecialMarks(scale, growFromBottom) {
        this.specialMarks.forEach(mark => {
            if (mark.value >= scale.leftIndex && mark.value <= scale.rightIndex) {
                const normalizedPos = scale.valueToNormalizedPosition(mark.value);
                const x = this.normalizedToPixel(normalizedPos);

                this.drawTick(x, mark.height || 15, mark.width || 1.5, growFromBottom);
                if (mark.label) {
                    this.drawLabel(x, mark.label, mark.height || 15, growFromBottom);
                }
            }
        });
    }

    drawTick(x, height, width, growFromBottom) {
        if (x < 0 || x > this.pixelWidth) return;

        const baseY = growFromBottom ? CONFIG.SLOT_HEIGHT : 0;
        this.ctx.beginPath();
        this.ctx.moveTo(x, baseY);
        this.ctx.lineTo(x, growFromBottom ? baseY - height : baseY + height);
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    drawLabel(x, text, height, growFromBottom) {
        const labelWidth = this.ctx.measureText(text).width;
        const labelX = x - labelWidth / 2;
        const baseY = growFromBottom ? CONFIG.SLOT_HEIGHT : 0;
        const labelY = growFromBottom ? baseY - height - 5 : baseY + height + 15;

        this.ctx.fillText(text, labelX, labelY);
    }

}


// Create scale definitions
// Single decade logarithmic scale (used for C and D)
const singleDecadeLogScale = new Scale({
    type: 'logarithmic',
    leftIndex: 1,
    rightIndex: 10,
    divisionRules: DivisionRuleSets.singleDecadeLog
});

// Two decade logarithmic scale (used for B)
const twoDecadeLogScale = new Scale({
    type: 'logarithmic',
    leftIndex: 1,
    rightIndex: 100,
    divisionRules: DivisionRuleSets.twoDecadeLog
});

// -------------------------------------------
// SCALE SETUP AND RENDERING
// -------------------------------------------

/**
 * Create and render all scales
 * @returns {Object} Object containing scale configurations
 */
function setupScales() {
    // Define scales and their rendering configurations
    const scaleConfigs = {
        slide: [
            {
                scale: twoDecadeLogScale,
                renderer: new ScaleRenderer(canvases.slide.ctx, CONFIG.SCALE_WIDTH, CONFIG.SLOT_HEIGHT, CONFIG.BUFFER_SPACE, {
                    name: 'B',
                    slot: 0,  // First slot
                    orientation: 'top',
                    marks: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100],
                    specialMarks: [],
                    divisionRules: DivisionRuleSets.twoDecadeLog
                })
            },
            {
                scale: singleDecadeLogScale,
                renderer: new ScaleRenderer(canvases.slide.ctx, CONFIG.SCALE_WIDTH, CONFIG.SLOT_HEIGHT, CONFIG.BUFFER_SPACE, {
                    name: 'C',
                    slot: 1,  // Second slot
                    orientation: 'bottom',
                    marks: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10],
                    specialMarks: [],
                    divisionRules: DivisionRuleSets.singleDecadeLog
                })
            }
        ],
        lowerStator: [
            {
                scale: singleDecadeLogScale,
                renderer: new ScaleRenderer(canvases.lowerStator.ctx, CONFIG.SCALE_WIDTH, CONFIG.SLOT_HEIGHT, CONFIG.BUFFER_SPACE, {
                    name: 'D',
                    slot: 0,  // First (and only) slot in lower stator
                    orientation: 'top',
                    marks: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10],
                    specialMarks: [],
                    divisionRules: DivisionRuleSets.singleDecadeLog
                })
            }
        ],
        upperStator: [
            {
                scale: twoDecadeLogScale,
                renderer: new ScaleRenderer(canvases.upperStator.ctx, CONFIG.SCALE_WIDTH, CONFIG.SLOT_HEIGHT, CONFIG.BUFFER_SPACE, {
                    name: 'A',
                    slot: 0,  // First slot in upper stator
                    orientation: 'bottom',
                    marks: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100],
                    specialMarks: [],
                    divisionRules: DivisionRuleSets.twoDecadeLog
                })
            }
        ]
    };

    // Render all scales
    renderAllScales(scaleConfigs);

    return scaleConfigs;
}

/**
 * Create scale labels dynamically based on configuration
 * @param {Object} scaleConfigs - Configuration object containing scales and renderers
 */
function createScaleLabels(scaleConfigs) {
    // Remove any existing labels first
    document.querySelectorAll('.scale-label').forEach(label => label.remove());

    // Helper function to create a label
    function createLabel(componentId, config) {
        const component = document.getElementById(componentId);
        const label = document.createElement('span');
        label.className = 'scale-label';
        label.textContent = config.renderer.name;

        // Add orientation class based on renderer orientation
        if (config.renderer.orientation === 'top') {
            label.classList.add('scale-label-top');
        } else {
            label.classList.add('scale-label-bottom');
        }

        component.appendChild(label);
    }

    // Create labels for each component
    scaleConfigs.slide.forEach(config => createLabel('slide', config));
    scaleConfigs.lowerStator.forEach(config => createLabel('lower-stator', config));
    scaleConfigs.upperStator.forEach(config => createLabel('upper-stator', config));
}

/**
 * Render all scales in their respective canvases
 * @param {Object} scaleConfigs - Configuration object containing scales and renderers
 */
function renderAllScales(scaleConfigs) {
    // Clear all canvases first
    canvases.slide.ctx.clearRect(0, 0, CONFIG.SCALE_WIDTH, CONFIG.SLIDE_HEIGHT);
    canvases.lowerStator.ctx.clearRect(0, 0, CONFIG.SCALE_WIDTH, CONFIG.LOWER_STATOR_HEIGHT);
    canvases.upperStator.ctx.clearRect(0, 0, CONFIG.SCALE_WIDTH, CONFIG.UPPER_STATOR_HEIGHT);

    // Render scales on each component
    scaleConfigs.slide.forEach((config, index) => {
        config.renderer.render(config.scale, index === 0); // Only clear canvas for first scale
    });

    scaleConfigs.lowerStator.forEach((config, index) => {
        config.renderer.render(config.scale, index === 0);
    });

    scaleConfigs.upperStator.forEach((config, index) => {
        config.renderer.render(config.scale, index === 0);
    });

    // Create labels dynamically
    createScaleLabels(scaleConfigs);
}

// Set up all scales
const scaleConfigs = setupScales();

// Example of more complex scales:
//
// A multi-decade scale (1 to 100):
// const multiDecadeScale = new Scale({
//     type: 'logarithmic',
//     leftIndex: 1,
//     rightIndex: 100
// });
//
// A scale with special marks:
// const piScale = new Scale({
//     type: 'logarithmic',
//     leftIndex: 1,
//     rightIndex: 10
// });
//
// And then render with:
// const piRenderer = new ScaleRenderer(ctx, width, height, buffer, {
//     name: 'Pi',
//     orientation: 'bottom',
//     marks: [1, 2, 3, 'π', 4, 5, 6, 7, 8, 9, 10],
//     specialMarks: [{
//         value: Math.PI,
//         label: 'π'
//     }, {
//         value: Math.E,
//         label: 'e'
//     }],
//     divisionRules: DivisionRuleSets.singleDecadeLog
// });

// Get elements
const cursor = document.getElementById('cursor');
const cursorValues = document.getElementById('cursor-values');
const devToggle = document.getElementById('dev-toggle');
const resetButton = document.getElementById('reset-button');

// Build scale registry from scaleConfigs for developer mode
const scales = [];

// Add scales in visual order (top to bottom): upper stator, slide, lower stator

// Add scales from upper stator
scaleConfigs.upperStator.forEach(config => {
    scales.push({
        name: config.renderer.name,
        scale: config.scale,
        canvas: canvases.upperStator.canvas,
        position: 'fixed',
        getOffset: () => 0
    });
});

// Add scales from slide
scaleConfigs.slide.forEach(config => {
    scales.push({
        name: config.renderer.name,
        scale: config.scale,
        canvas: canvases.slide.canvas,
        position: 'slide',
        getOffset: () => slideState.position
    });
});

// Add scales from lower stator
scaleConfigs.lowerStator.forEach(config => {
    scales.push({
        name: config.renderer.name,
        scale: config.scale,
        canvas: canvases.lowerStator.canvas,
        position: 'fixed',
        getOffset: () => 0
    });
});

// -------------------------------------------
// CURSOR MANAGEMENT
// -------------------------------------------

const CURSOR_CONFIG = {
    width: 96,  // 60% wider than original 60px
    get minPosition() {
        return CONFIG.BODY_PADDING + CONFIG.BUFFER_SPACE - this.width / 2;
    },
    get maxPosition() {
        return CONFIG.BODY_PADDING + CONFIG.BUFFER_SPACE + CONFIG.EFFECTIVE_WIDTH - this.width / 2;
    }
};

// Cursor state
const cursorState = {
    position: CURSOR_CONFIG.minPosition,
    isDragging: false,
    dragStartX: 0
};

/**
 * Initialize cursor position and settings
 */
function initializeCursor() {
    cursor.style.left = cursorState.position + 'px';
    document.body.classList.add('dev-mode');
    updateCursorValues();
}

/**
 * Update cursor position with bounds checking
 * @param {number} newPosition - New cursor position in pixels
 */
function setCursorPosition(newPosition) {
    cursorState.position = Math.max(
        CURSOR_CONFIG.minPosition,
        Math.min(CURSOR_CONFIG.maxPosition, newPosition)
    );
    cursor.style.left = cursorState.position + 'px';
    updateCursorValues();
}

/**
 * Get cursor hairline position (center of cursor)
 * @returns {number} Hairline position in pixels
 */
function getCursorHairlinePosition() {
    return cursorState.position + CURSOR_CONFIG.width / 2;
}

// -------------------------------------------
// SLIDE MANAGEMENT
// -------------------------------------------

// Slide state
const slideState = {
    position: 0,
    isDragging: false,
    dragStartX: 0
};

/**
 * Update slide position with bounds checking
 * @param {number} newPosition - New slide position in pixels
 */
function setSlidePosition(newPosition) {
    slideState.position = Math.max(
        -CONFIG.EFFECTIVE_WIDTH,
        Math.min(CONFIG.EFFECTIVE_WIDTH, newPosition)
    );
    slide.style.transform = `translateX(${slideState.position}px)`;
    updateCursorValues();
}

// Initialize cursor
initializeCursor();

// Developer mode toggle
devToggle.addEventListener('click', () => {
    document.body.classList.toggle('dev-mode');
    updateCursorValues();
});

// Function to get all possible tick values for a scale
function getAllTickValues(scale) {
    const tickValues = new Set();


    // Process each division rule range (use appropriate defaults based on scale range)
    const divisionRules = scale.divisionRules ||
        (scale.rightIndex === 100 ? DivisionRuleSets.twoDecadeLog : DivisionRuleSets.singleDecadeLog);
    divisionRules.forEach(rule => {
        const [rangeStart, rangeEnd] = rule.range;

        // Get divisions for this range
        const divisions = selectDivisions(divisionRules, rule.range);

        // Generate tick positions for each division type
        divisions.forEach(division => {
            const rangeWidth = rangeEnd - rangeStart;

            // For multi-decade scales, interpret divisions differently
            let numSteps;
            if (rangeStart >= 10 && division.name === 'tenths') {
                // 'tenths' in range [10,20] means 10, 11, 12, ..., 20 (step by 1)
                numSteps = rangeWidth;
            } else if (rangeStart >= 10 && division.name === 'seconds') {
                // 'seconds' in range [20,30] means 20, 25, 30 (step by 5)
                numSteps = rangeWidth / 5;
            } else {
                // Normal interpretation for first decade
                numSteps = Math.floor(rangeWidth * division.divisor);
            }

            const step = rangeWidth / numSteps;

            // Generate tick positions within this range
            for (let i = 0; i <= numSteps; i++) {
                const value = rangeStart + i * step;
                if (value >= scale.leftIndex && value <= scale.rightIndex) {
                    // Round to appropriate precision to avoid floating point issues
                    tickValues.add(Math.round(value * 1000) / 1000);
                }
            }
        });
    });

    // Add index values
    tickValues.add(scale.leftIndex);
    tickValues.add(scale.rightIndex);

    return Array.from(tickValues).sort((a, b) => a - b);
}

// Function to calculate value at a given position on a scale
function getScaleValue(scale, pixelPosition) {
    // Convert pixel position to normalized position
    const normalizedPosition = (pixelPosition - CONFIG.BUFFER_SPACE) / CONFIG.EFFECTIVE_WIDTH;

    // Clamp to valid range
    if (normalizedPosition < 0) {
        return scale.leftIndex;
    }
    if (normalizedPosition > 1) {
        return scale.rightIndex;
    }

    // Calculate exact value based on scale type
    let exactValue;
    if (scale.type === 'logarithmic') {
        const logRange = Math.log10(scale.rightIndex / scale.leftIndex);
        exactValue = scale.leftIndex * Math.pow(10, normalizedPosition * logRange);
    } else {
        // Linear scale
        exactValue = scale.leftIndex + normalizedPosition * (scale.rightIndex - scale.leftIndex);
    }

    // Get all tick values for this scale
    const tickValues = getAllTickValues(scale);


    // Find the nearest tick value
    let nearestTick = tickValues[0];
    let minDistance = Math.abs(exactValue - nearestTick);

    for (const tick of tickValues) {
        const distance = Math.abs(exactValue - tick);
        if (distance < minDistance) {
            minDistance = distance;
            nearestTick = tick;
        }
    }

    return nearestTick;
}

/**
 * Update cursor values display for developer mode
 */
function updateCursorValues() {
    if (!document.body.classList.contains('dev-mode')) return;

    const hairlineX = getCursorHairlinePosition();
    let html = '';

    scales.forEach(scaleInfo => {
        // Calculate the effective position relative to the scale (removing body padding)
        const relativeHairlineX = hairlineX - CONFIG.BODY_PADDING;
        // For fixed scales, use hairline position directly
        // For slide scales, subtract the slide offset
        const effectiveX = scaleInfo.position === 'fixed'
            ? relativeHairlineX
            : relativeHairlineX - slideState.position;
        const value = getScaleValue(scaleInfo.scale, effectiveX);
        html += `<div class="scale-value"><span class="scale-name">${scaleInfo.name}:</span> ${value.toFixed(2)}</div>`;
    });

    cursorValues.innerHTML = html;
}

// -------------------------------------------
// DRAG HANDLING
// -------------------------------------------

/**
 * Handle drag start for an element
 * @param {Object} state - State object to update (cursorState or slideState)
 * @param {number} clientX - Mouse/touch X coordinate
 * @param {number} currentPosition - Current position of the element
 */
function handleDragStart(state, clientX, currentPosition) {
    state.isDragging = true;
    state.dragStartX = clientX - currentPosition;
}

/**
 * Handle drag move for cursor
 * @param {number} clientX - Mouse/touch X coordinate
 */
function handleCursorDragMove(clientX) {
    if (!cursorState.isDragging) return;
    const newPosition = clientX - cursorState.dragStartX;
    setCursorPosition(newPosition);
}

/**
 * Handle drag move for slide
 * @param {number} clientX - Mouse/touch X coordinate
 */
function handleSlideDragMove(clientX) {
    if (!slideState.isDragging) return;
    const newPosition = clientX - slideState.dragStartX;
    setSlidePosition(newPosition);
}

/**
 * Handle drag end
 */
function handleDragEnd() {
    cursorState.isDragging = false;
    slideState.isDragging = false;
}

// -------------------------------------------
// EVENT LISTENERS
// -------------------------------------------

// Mouse events
slide.addEventListener('mousedown', (e) => {
    handleDragStart(slideState, e.clientX, slideState.position);
});

cursor.addEventListener('mousedown', (e) => {
    handleDragStart(cursorState, e.clientX, cursorState.position);
    e.stopPropagation();
});

document.addEventListener('mousemove', (e) => {
    handleSlideDragMove(e.clientX);
    handleCursorDragMove(e.clientX);
});

document.addEventListener('mouseup', handleDragEnd);

// Touch events
slide.addEventListener('touchstart', (e) => {
    handleDragStart(slideState, e.touches[0].clientX, slideState.position);
});

cursor.addEventListener('touchstart', (e) => {
    handleDragStart(cursorState, e.touches[0].clientX, cursorState.position);
    e.stopPropagation();
});

document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        handleSlideDragMove(e.touches[0].clientX);
        handleCursorDragMove(e.touches[0].clientX);
    }
});

document.addEventListener('touchend', handleDragEnd);

// -------------------------------------------
// UI CONTROLS
// -------------------------------------------

// Reset button functionality
resetButton.addEventListener('click', () => {
    // Add animation class
    slide.classList.add('resetting');

    // Reset slide position
    setSlidePosition(0);

    // Remove animation class after transition
    setTimeout(() => {
        slide.classList.remove('resetting');
    }, 300);
});
