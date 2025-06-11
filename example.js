/**
 * Example Slide Rule Configuration
 * Demonstrates how to use the slide rule library
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Create slide rule instance
    const slideRule = new SlideRule('slide-rule-container', {
        width: 1200,
        slotHeight: 40,
        bufferSpace: 30,
        upperStatorSlots: 1,
        slideSlots: 2,
        lowerStatorSlots: 1,
        improveQuality: true
    });

    // Create scale definitions
    const singleDecadeLogScale = new Scale({
        type: 'logarithmic',
        leftIndex: 1,
        rightIndex: 10
    });

    const twoDecadeLogScale = new Scale({
        type: 'logarithmic',
        leftIndex: 1,
        rightIndex: 100
    });

    // Render A scale (upper stator)
    slideRule.render(twoDecadeLogScale, {
        component: SlideRule.UPPER_STATOR,
        slot: 0,
        name: 'A',
        secondaryLabel: 'x²',
        orientation: 'bottom',
        marks: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100],
        divisionRules: DivisionRuleSets.twoDecadeLog
    });

    // Render B scale (slide top)
    slideRule.render(twoDecadeLogScale, {
        component: SlideRule.SLIDE,
        slot: 0,
        name: 'B',
        secondaryLabel: 'x²',
        orientation: 'top',
        marks: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100],
        divisionRules: DivisionRuleSets.twoDecadeLog
    });

    // Render C scale (slide bottom)
    slideRule.render(singleDecadeLogScale, {
        component: SlideRule.SLIDE,
        slot: 1,
        name: 'C',
        orientation: 'bottom',
        marks: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10],
        specialMarks: [{
            value: Math.PI,
            label: 'π',
            height: 18,
            width: 1.5,
            color: '#A52A2A'
        }],
        divisionRules: DivisionRuleSets.singleDecadeLog
    });

    // Render D scale (lower stator)
    slideRule.render(singleDecadeLogScale, {
        component: SlideRule.LOWER_STATOR,
        slot: 0,
        name: 'D',
        orientation: 'top',
        marks: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10],
        divisionRules: DivisionRuleSets.singleDecadeLog
    });

    // Enable developer mode by default
    slideRule.setDeveloperMode(true);

    // Add UI controls
    const devToggle = document.getElementById('dev-toggle');
    const resetButton = document.getElementById('reset-button');

    if (devToggle) {
        devToggle.addEventListener('click', () => {
            const isDevMode = document.body.classList.contains('dev-mode');
            slideRule.setDeveloperMode(!isDevMode);
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            slideRule.resetSlide();
        });
    }

    // Example of adding a scale with special marks (commented out)
    /*
    const piScale = new Scale({
        type: 'logarithmic',
        leftIndex: 1,
        rightIndex: 10
    });

    slideRule.render(piScale, {
        component: SlideRule.UPPER_STATOR,
        slot: 1,
        name: 'π',
        orientation: 'top',
        marks: [1, 2, 3, 'π', 4, 5, 6, 7, 8, 9, 10],
        specialMarks: [{
            value: Math.E,
            label: 'e',
            height: 20,
            width: 2
        }],
        divisionRules: DivisionRuleSets.singleDecadeLog
    });
    */

    // Store reference for external control
    window.slideRuleInstance = slideRule;
});
