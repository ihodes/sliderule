/**
 * Slide Rule Scales Library
 * Mathematical scale definitions and rendering
 */

// -------------------------------------------
// SCALE DIVISIONS: Canonical registry
// -------------------------------------------
const ScaleDivisions = {
    // 0.5 spacing
    seconds:        { divisor: 2,   defaultHeight: 12, defaultWidth: 0.5,  minPixelSpacing: 15  },
    // 0.2 spacing
    fifths:         { divisor: 5,   defaultHeight: 8,  defaultWidth: 0.5,  minPixelSpacing: 8   },
    // 0.1 spacing
    tenths:         { divisor: 10,  defaultHeight: 10, defaultWidth: 0.5,  minPixelSpacing: 5   },
    // 0.05 spacing
    twentieths:     { divisor: 20,  defaultHeight: 7,  defaultWidth: 0.5,  minPixelSpacing: 3   },
    // 0.02 spacing
    fiftieths:      { divisor: 50,  defaultHeight: 6,  defaultWidth: 0.5,  minPixelSpacing: 2   },
    // 0.01 spacing
    hundredths:     { divisor: 100, defaultHeight: 4,  defaultWidth: 0.5,  minPixelSpacing: 1.5 },
    // 0.005 spacing
    twoHundredths:  { divisor: 200, defaultHeight: 3,  defaultWidth: 0.5, minPixelSpacing: 1   },
    // 0.002 spacing
    fiveHundredths: { divisor: 500, defaultHeight: 3,  defaultWidth: 0.5,  minPixelSpacing: 0.8 }
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
// SCALE CLASS: Pure mathematical representation
// -------------------------------------------
class Scale {
    constructor(options) {
        this.type = options.type || 'logarithmic'; // 'logarithmic' or 'linear'
        this.leftIndex = options.leftIndex || 1;
        this.rightIndex = options.rightIndex || 10;
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
        this.name = options.name || 'Scale';
        this.secondaryLabel = options.secondaryLabel || null;
        this.slot = options.slot || 0;
        this.orientation = options.orientation || 'bottom';
        this.marks = options.marks || 'auto';
        this.specialMarks = options.specialMarks || [];
        this.divisionRules = options.divisionRules || DivisionRuleSets.singleDecadeLog;
        this.reversed = options.reversed || false;
        this.slotHeight = options.slotHeight || 40;
    }

    // Convert normalized position to pixel position
    normalizedToPixel(normalizedPos) {
        const effectivePos = this.reversed ? (1 - normalizedPos) : normalizedPos;
        return this.bufferSpace + effectivePos * this.effectiveWidth;
    }

    // Render a complete scale
    render(scale, clearCanvas = true) {
        if (clearCanvas) {
            this.ctx.clearRect(-1, -1, this.pixelWidth + 2, this.pixelHeight + 2);
        }

        this.ctx.save();
        const slotY = this.slot * this.slotHeight;
        this.ctx.translate(0, slotY);

        this.ctx.strokeStyle = '#3a2a1a';
        this.ctx.fillStyle = '#3a2a1a';
        this.ctx.font = '12px "Times New Roman", Times, serif';

        const growFromBottom = this.orientation === 'bottom';
        const scaleY = growFromBottom ? this.slotHeight : 0;

        // Draw scale border
        this.ctx.beginPath();
        this.ctx.moveTo(0, scaleY);
        this.ctx.lineTo(this.pixelWidth, scaleY);
        this.ctx.stroke();

        // Draw all elements
        this.renderTicks(scale, growFromBottom);
        this.renderMarks(scale, growFromBottom);
        this.renderSpecialMarks(scale, growFromBottom);

        this.ctx.restore();
    }

    renderTicks(scale, growFromBottom) {
        const drawnPositions = new Set();

        this.divisionRules.forEach(rule => {
            const [rangeStart, rangeEnd] = rule.range;
            const divisions = selectDivisions(this.divisionRules, rule.range);

            divisions.forEach(division => {
                const rangeWidth = rangeEnd - rangeStart;

                let numSteps;
                if (rangeStart >= 10 && division.name === 'tenths') {
                    numSteps = rangeWidth;
                } else if (rangeStart >= 10 && division.name === 'seconds') {
                    numSteps = rangeWidth / 5;
                } else {
                    numSteps = Math.floor(rangeWidth * division.divisor);
                }

                const step = rangeWidth / numSteps;

                for (let i = 0; i <= numSteps; i++) {
                    const value = rangeStart + i * step;
                    if (value > scale.rightIndex || value < scale.leftIndex) continue;

                    // Skip marks and special marks
                    const marks = this.generateMarks(scale);
                    const isMark = marks.some(mark => Math.abs(mark.value - value) < 0.001);
                    const isSpecial = this.specialMarks.some(mark => Math.abs(mark.value - value) < 0.001);
                    if (isMark || isSpecial) continue;

                    const normalizedPos = scale.valueToNormalizedPosition(value);
                    const x = Math.round(this.normalizedToPixel(normalizedPos));

                    const posKey = `${x}-${division.name}`;
                    if (drawnPositions.has(posKey)) continue;
                    drawnPositions.add(posKey);

                    this.drawTick(x, division.defaultHeight, division.defaultWidth, growFromBottom);
                }
            });
        });
    }

    generateMarks(scale) {
        if (this.marks === 'auto') {
            const marks = [];
            if (scale.type === 'logarithmic') {
                if (scale.rightIndex / scale.leftIndex === 10) {
                    // Single decade
                    const standardMarks = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10];
                    standardMarks.forEach(val => {
                        if (val >= scale.leftIndex && val <= scale.rightIndex) {
                            marks.push({ value: val, text: String(val) });
                        }
                    });
                } else {
                    // Multi-decade
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
                // Linear scale
                const step = (scale.rightIndex - scale.leftIndex) / 10;
                for (let i = 0; i <= 10; i++) {
                    const val = scale.leftIndex + i * step;
                    marks.push({ value: val, text: String(val) });
                }
            }
            return marks;
        } else if (Array.isArray(this.marks)) {
            return this.marks.map(val => {
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

                // Save current styles
                const originalStrokeStyle = this.ctx.strokeStyle;
                const originalFillStyle = this.ctx.fillStyle;

                // Apply mark color if specified
                if (mark.color) {
                    this.ctx.strokeStyle = mark.color;
                    this.ctx.fillStyle = mark.color;
                }

                this.drawTick(x, mark.height || 15, mark.width || 1.5, growFromBottom);
                if (mark.label) {
                    this.drawLabel(x, mark.label, mark.height || 15, growFromBottom);
                }

                // Restore original styles
                this.ctx.strokeStyle = originalStrokeStyle;
                this.ctx.fillStyle = originalFillStyle;
            }
        });
    }

    drawTick(x, height, width, growFromBottom) {
        if (x < 0 || x > this.pixelWidth) return;

        const baseY = growFromBottom ? this.slotHeight : 0;
        this.ctx.beginPath();
        this.ctx.moveTo(x, baseY);
        this.ctx.lineTo(x, growFromBottom ? baseY - height : baseY + height);
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    drawLabel(x, text, height, growFromBottom) {
        const labelWidth = this.ctx.measureText(text).width;
        const labelX = x - labelWidth / 2;
        const baseY = growFromBottom ? this.slotHeight : 0;
        const labelY = growFromBottom ? baseY - height - 5 : baseY + height + 15;

        this.ctx.fillText(text, labelX, labelY);
    }

    // Get all possible tick values for a scale (used for cursor snapping)
    getAllTickValues(scale) {
        const tickValues = new Set();

        this.divisionRules.forEach(rule => {
            const [rangeStart, rangeEnd] = rule.range;
            const divisions = selectDivisions(this.divisionRules, rule.range);

            divisions.forEach(division => {
                const rangeWidth = rangeEnd - rangeStart;

                // Interpret divisions for multi-decade scales
                let numSteps;
                if (rangeStart >= 10 && division.name === 'tenths') {
                    numSteps = rangeWidth;
                } else if (rangeStart >= 10 && division.name === 'seconds') {
                    numSteps = rangeWidth / 5;
                } else {
                    numSteps = Math.floor(rangeWidth * division.divisor);
                }

                const step = rangeWidth / numSteps;

                for (let i = 0; i <= numSteps; i++) {
                    const value = rangeStart + i * step;
                    if (value >= scale.leftIndex && value <= scale.rightIndex) {
                        tickValues.add(Math.round(value * 1000) / 1000);
                    }
                }
            });
        });

        // Add index values
        tickValues.add(scale.leftIndex);
        tickValues.add(scale.rightIndex);

        // Add marks
        const marks = this.generateMarks(scale);
        marks.forEach(mark => tickValues.add(mark.value));

        // Add special marks
        this.specialMarks.forEach(mark => {
            if (mark.value >= scale.leftIndex && mark.value <= scale.rightIndex) {
                tickValues.add(mark.value);
            }
        });

        return Array.from(tickValues).sort((a, b) => a - b);
    }
}

// Helper function to select divisions
function selectDivisions(divisionRules, range) {
    const [rangeStart, rangeEnd] = range;
    const applicableRule = divisionRules.find(rule =>
        rangeStart >= rule.range[0] && rangeEnd <= rule.range[1]
    ) || { divisions: ['tenths'] };

    const selectedDivisions = [];
    applicableRule.divisions.forEach(divName => {
        const division = ScaleDivisions[divName];
        if (!division) {
            console.error("ScaleDivision of type '", divName, "' doesn't exist.")
            return;
        }
        selectedDivisions.push({
            name: divName,
            ...division
        });
    });

    return selectedDivisions;
}

// Export for use
window.Scale = Scale;
window.ScaleRenderer = ScaleRenderer;
window.ScaleDivisions = ScaleDivisions;
window.DivisionRuleSets = DivisionRuleSets;
window.MathConstants = MathConstants;
