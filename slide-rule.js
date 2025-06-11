/**
 * Slide Rule Library
 * A flexible, extensible slide rule implementation
 */

class SlideRule {
    // Component constants for clean API
    static UPPER_STATOR = 'upperStator';
    static SLIDE = 'slide';
    static LOWER_STATOR = 'lowerStator';

    constructor(containerId, options = {}) {
        // Configuration with defaults
        this.config = {
            width: options.width || 900,  // Direct pixel width
            slotHeight: options.slotHeight || 40,
            bufferSpace: options.bufferSpace || 30,
            snapToTicks: options.snapToTicks !== false,  // Enable tick snapping by default
            slots: {
                upperStator: options.upperStatorSlots || 0,
                slide: options.slideSlots || 2,
                lowerStator: options.lowerStatorSlots || 1
            },
            rendering: {
                improveQuality: options.improveQuality !== false,
                lineWidths: options.lineWidths || {}
            }
        };

        // Dynamic spacing - will be calculated based on secondary labels
        this.config.componentLeftPadding = 0;
        
        // Calculate derived values
        this.config.effectiveWidth = this.config.width - 2 * this.config.bufferSpace;
        this.config.upperStatorHeight = this.config.slots.upperStator * this.config.slotHeight || 40;
        this.config.slideHeight = this.config.slots.slide * this.config.slotHeight;
        this.config.lowerStatorHeight = this.config.slots.lowerStator * this.config.slotHeight;
        this.config.totalHeight = this.config.upperStatorHeight + this.config.slideHeight + this.config.lowerStatorHeight;

        // Initialize DOM elements
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }

        // Create slide rule structure
        this._createStructure();
        this._initializeCanvases();
        this._initializeCursor();
        this._initializeDragHandling();

        // Scale configurations
        this.scaleConfigs = {
            upperStator: [],
            slide: [],
            lowerStator: []
        };
    }

    /**
     * Create the DOM structure for the slide rule
     */
    _createStructure() {
        this.container.innerHTML = `
            <div id="sr-body">
                <div id="sr-upper-stator">
                    <canvas id="sr-upper-stator-canvas"></canvas>
                </div>
                <div id="sr-slide">
                    <canvas id="sr-slide-canvas"></canvas>
                </div>
                <div id="sr-lower-stator">
                    <canvas id="sr-lower-stator-canvas"></canvas>
                </div>
                <div id="sr-cursor">
                    <div id="sr-cursor-values"></div>
                </div>
            </div>
        `;

        // Get references to elements
        this.elements = {
            body: document.getElementById('sr-body'),
            upperStator: document.getElementById('sr-upper-stator'),
            slide: document.getElementById('sr-slide'),
            lowerStator: document.getElementById('sr-lower-stator'),
            cursor: document.getElementById('sr-cursor'),
            cursorValues: document.getElementById('sr-cursor-values')
        };

        // Apply styles
        this._applyStyles();
    }

    /**
     * Apply dynamic styles based on configuration
     */
    _applyStyles() {
        const { body, slide, upperStator, lowerStator } = this.elements;

        // Apply dimensions
        body.style.width = this.config.width + 'px';
        slide.style.height = this.config.slideHeight + 'px';
        upperStator.style.height = this.config.upperStatorHeight + 'px';
        lowerStator.style.height = this.config.lowerStatorHeight + 'px';

        // Ensure full width is visible
        document.body.style.minWidth = this.config.width + 'px';
        document.body.style.overflowX = 'auto';
    }

    /**
     * Initialize canvases with proper scaling
     */
    _initializeCanvases() {
        this.canvases = {
            upperStator: this._setupCanvas('sr-upper-stator-canvas', this.config.width, this.config.upperStatorHeight),
            slide: this._setupCanvas('sr-slide-canvas', this.config.width, this.config.slideHeight),
            lowerStator: this._setupCanvas('sr-lower-stator-canvas', this.config.width, this.config.lowerStatorHeight)
        };
    }

    /**
     * Set up individual canvas with DPI scaling
     */
    _setupCanvas(canvasId, width, height) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set actual canvas size
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        // Set display size
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        // Scale context
        ctx.scale(dpr, dpr);

        // Apply rendering improvements if enabled
        if (this.config.rendering.improveQuality) {
            ctx.imageSmoothingEnabled = false;
            ctx.translate(0.5, 0.5);
        }

        return { canvas, ctx, width, height };
    }

    /**
     * Initialize cursor
     */
    _initializeCursor() {
        this.cursor = {
            width: 96,
            position: 0, // Will be set properly after layout update
            isDragging: false,
            dragStartX: 0,
            minPosition: 0,
            maxPosition: 0
        };

        this.elements.cursor.style.width = this.cursor.width + 'px';
        
        // Initial position will be set after layout is determined
        this.cursor.position = this.config.bufferSpace - this.cursor.width / 2;
        this.elements.cursor.style.left = this.cursor.position + 'px';
    }

    /**
     * Initialize drag handling
     */
    _initializeDragHandling() {
        this.slideState = {
            position: 0,
            isDragging: false,
            dragStartX: 0
        };

        // Mouse events
        this.elements.slide.addEventListener('mousedown', (e) => this._handleSlideStart(e));
        this.elements.cursor.addEventListener('mousedown', (e) => this._handleCursorStart(e));
        document.addEventListener('mousemove', (e) => this._handleDragMove(e));
        document.addEventListener('mouseup', () => this._handleDragEnd());

        // Touch events
        this.elements.slide.addEventListener('touchstart', (e) => this._handleSlideStart(e));
        this.elements.cursor.addEventListener('touchstart', (e) => this._handleCursorStart(e));
        document.addEventListener('touchmove', (e) => this._handleDragMove(e));
        document.addEventListener('touchend', () => this._handleDragEnd());
    }

    _handleSlideStart(e) {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        this.slideState.isDragging = true;
        this.slideState.dragStartX = clientX - this.slideState.position;
    }

    _handleCursorStart(e) {
        e.preventDefault();
        e.stopPropagation();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        this.cursor.isDragging = true;
        this.cursor.dragStartX = clientX - this.cursor.position;
    }

    _handleDragMove(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;

        if (this.slideState.isDragging) {
            const newPosition = clientX - this.slideState.dragStartX;
            this.setSlidePosition(newPosition);
        }

        if (this.cursor.isDragging) {
            const newPosition = clientX - this.cursor.dragStartX;
            this.setCursorPosition(newPosition);
        }
    }

    _handleDragEnd() {
        this.slideState.isDragging = false;
        this.cursor.isDragging = false;
    }

    /**
     * Set slide position with bounds checking
     */
    setSlidePosition(position) {
        this.slideState.position = Math.max(
            -this.config.effectiveWidth,
            Math.min(this.config.effectiveWidth, position)
        );
        this.elements.slide.style.transform = `translateX(${this.slideState.position}px)`;
        this._updateCursorValues();
    }

    /**
     * Set cursor position with bounds checking
     */
    setCursorPosition(position) {
        this.cursor.position = Math.max(
            this.cursor.minPosition,
            Math.min(this.cursor.maxPosition, position)
        );
        this.elements.cursor.style.left = this.cursor.position + 'px';
        this._updateCursorValues();
    }

    /**
     * Reset slide to initial position
     */
    resetSlide() {
        this.elements.slide.classList.add('resetting');
        this.setSlidePosition(0);
        setTimeout(() => {
            this.elements.slide.classList.remove('resetting');
        }, 300);
    }

    /**
     * Render a scale on the slide rule
     * @param {Scale} scale - The scale object to render
     * @param {Object} config - Rendering configuration
     */
    render(scale, config) {
        if (!config.component || !this.scaleConfigs[config.component]) {
            throw new Error(`Invalid component: ${config.component}`);
        }

        // Get canvas context and dimensions for the component
        const canvas = this.canvases[config.component];
        
        // Create renderer with slide rule's configuration
        const renderer = new ScaleRenderer(canvas.ctx, this.config.width, canvas.height, this.config.bufferSpace, {
            name: config.name || 'Scale',
            secondaryLabel: config.secondaryLabel || null,
            slot: config.slot || 0,
            orientation: config.orientation || 'bottom',
            marks: config.marks || 'auto',
            specialMarks: config.specialMarks || [],
            divisionRules: config.divisionRules || DivisionRuleSets.singleDecadeLog,
            reversed: config.reversed || false,
            slotHeight: this.config.slotHeight
        });

        // Store the scale and renderer
        this.scaleConfigs[config.component].push({
            scale: scale,
            renderer: renderer
        });

        // Re-render all scales and update labels
        this._updateLayoutForSecondaryLabels();
        this._renderAllScales();
        this._createScaleLabels();
    }

    /**
     * Check if any scales have secondary labels and update layout accordingly
     */
    _updateLayoutForSecondaryLabels() {
        let hasSecondaryLabels = false;
        
        // Check all scale configs for secondary labels
        ['upperStator', 'slide', 'lowerStator'].forEach(component => {
            this.scaleConfigs[component].forEach(config => {
                if (config.renderer.secondaryLabel) {
                    hasSecondaryLabels = true;
                }
            });
        });

        // Update padding and layout
        this.config.componentLeftPadding = hasSecondaryLabels ? 50 : 0;
        
        // Adjust effective width when secondary labels are present
        this.config.effectiveWidth = this.config.width - 2 * this.config.bufferSpace - this.config.componentLeftPadding;
        
        // Update component styles and canvas dimensions
        if (hasSecondaryLabels) {
            this.elements.upperStator.style.paddingLeft = '50px';
            this.elements.slide.style.paddingLeft = '50px';
            this.elements.lowerStator.style.paddingLeft = '50px';
            
            // Offset canvases and reduce their width
            const adjustedWidth = this.config.width - 50;
            this.canvases.upperStator.canvas.style.left = '50px';
            this.canvases.upperStator.canvas.style.width = adjustedWidth + 'px';
            this.canvases.slide.canvas.style.left = '50px';
            this.canvases.slide.canvas.style.width = adjustedWidth + 'px';
            this.canvases.lowerStator.canvas.style.left = '50px';
            this.canvases.lowerStator.canvas.style.width = adjustedWidth + 'px';
        } else {
            this.elements.upperStator.style.paddingLeft = '0px';
            this.elements.slide.style.paddingLeft = '0px';
            this.elements.lowerStator.style.paddingLeft = '0px';
            
            // Reset canvas positions and width
            this.canvases.upperStator.canvas.style.left = '0px';
            this.canvases.upperStator.canvas.style.width = this.config.width + 'px';
            this.canvases.slide.canvas.style.left = '0px';
            this.canvases.slide.canvas.style.width = this.config.width + 'px';
            this.canvases.lowerStator.canvas.style.left = '0px';
            this.canvases.lowerStator.canvas.style.width = this.config.width + 'px';
        }

        // Update cursor bounds
        this._updateCursorBounds();
    }

    /**
     * Update cursor positioning bounds based on current layout
     */
    _updateCursorBounds() {
        this.cursor.minPosition = this.config.componentLeftPadding + this.config.bufferSpace - this.cursor.width / 2;
        this.cursor.maxPosition = this.config.componentLeftPadding + this.config.bufferSpace + this.config.effectiveWidth - this.cursor.width / 2;
        
        // Reposition cursor if it's outside new bounds
        if (this.cursor.position < this.cursor.minPosition) {
            this.setCursorPosition(this.cursor.minPosition);
        } else if (this.cursor.position > this.cursor.maxPosition) {
            this.setCursorPosition(this.cursor.maxPosition);
        }
    }

    /**
     * Render all scales
     */
    _renderAllScales() {
        // Clear all canvases
        Object.values(this.canvases).forEach(({ ctx, width, height }) => {
            ctx.clearRect(-1, -1, width + 2, height + 2); // Account for translate
        });

        // Render each component's scales
        ['upperStator', 'slide', 'lowerStator'].forEach(component => {
            this.scaleConfigs[component].forEach((config, index) => {
                config.renderer.render(config.scale, index === 0);
            });
        });
    }

    /**
     * Create scale labels dynamically
     */
    _createScaleLabels() {
        // Remove existing labels
        this.container.querySelectorAll('.sr-scale-label').forEach(label => label.remove());

        // Create new labels
        ['upperStator', 'slide', 'lowerStator'].forEach(component => {
            const element = this.elements[component];
            this.scaleConfigs[component].forEach(config => {
                // Create primary label
                const label = document.createElement('span');
                label.className = 'sr-scale-label';
                label.textContent = config.renderer.name;

                if (config.renderer.orientation === 'top') {
                    label.classList.add('sr-scale-label-top');
                } else {
                    label.classList.add('sr-scale-label-bottom');
                }

                element.appendChild(label);

                // Create secondary label if specified
                if (config.renderer.secondaryLabel) {
                    const secondaryLabel = document.createElement('span');
                    secondaryLabel.className = 'sr-scale-label sr-secondary-label';
                    secondaryLabel.textContent = config.renderer.secondaryLabel;
                    
                    if (config.renderer.orientation === 'top') {
                        secondaryLabel.classList.add('sr-scale-label-top');
                    } else {
                        secondaryLabel.classList.add('sr-scale-label-bottom');
                    }
                    
                    element.appendChild(secondaryLabel);
                }
            });
        });
    }

    /**
     * Enable/disable developer mode
     */
    setDeveloperMode(enabled) {
        if (enabled) {
            this.elements.body.classList.add('sr-dev-mode');
            document.body.classList.add('dev-mode');
        } else {
            this.elements.body.classList.remove('sr-dev-mode');
            document.body.classList.remove('dev-mode');
        }
        this._updateCursorValues();
    }

    /**
     * Update cursor value display
     */
    _updateCursorValues() {
        if (!this.elements.body.classList.contains('sr-dev-mode')) return;

        const hairlineX = this.cursor.position + this.cursor.width / 2;
        let html = '';

        // Build scale list in visual order
        const scales = [];
        ['upperStator', 'slide', 'lowerStator'].forEach(component => {
            this.scaleConfigs[component].forEach(config => {
                scales.push({
                    name: config.renderer.name,
                    scale: config.scale,
                    renderer: config.renderer,
                    component: component
                });
            });
        });

        scales.forEach(scaleInfo => {
            // The hairline position is relative to the document
            // Convert to canvas-relative position by subtracting component left padding
            const canvasRelativeX = hairlineX - this.config.componentLeftPadding;
            
            // For slide scales, also subtract slide position
            const effectiveX = scaleInfo.component === 'slide'
                ? canvasRelativeX - this.slideState.position
                : canvasRelativeX;
            
            
            const value = this._getScaleValue(scaleInfo.scale, effectiveX, scaleInfo.renderer);
            html += `<div class="sr-scale-value"><span class="sr-scale-name">${scaleInfo.name}:</span> ${value.toFixed(2)}</div>`;
        });

        this.elements.cursorValues.innerHTML = html;
    }

    /**
     * Calculate value at position on scale with optional snapping
     */
    _getScaleValue(scale, pixelPosition, renderer = null) {
        const normalizedPosition = (pixelPosition - this.config.bufferSpace) / this.config.effectiveWidth;

        if (normalizedPosition < 0) return scale.leftIndex;
        if (normalizedPosition > 1) return scale.rightIndex;

        let exactValue;
        if (scale.type === 'logarithmic') {
            const logRange = Math.log10(scale.rightIndex / scale.leftIndex);
            exactValue = scale.leftIndex * Math.pow(10, normalizedPosition * logRange);
        } else {
            exactValue = scale.leftIndex + normalizedPosition * (scale.rightIndex - scale.leftIndex);
        }

        // If renderer provided and snap enabled, snap to nearest tick
        if (renderer && this.config.snapToTicks !== false) {
            const tickValues = renderer.getAllTickValues(scale);
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

        return exactValue;
    }


    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
}

// Export for use in other files
window.SlideRule = SlideRule;
