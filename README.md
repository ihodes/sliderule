# sliderule.js

A very simple, no dependencies, JavaScript library for creating interactive,
customizable slide rules in the browser.

## Usage

See example.html for a working example (you can find that
[here](https://isaachodes.io/sliderule)). The API is roughly as follows:

```javascript
const slideRule = new SlideRule('container-id', {
    width: 1200,
    slotHeight: 40,
    upperStatorSlots: 1,
    slideSlots: 2,
    lowerStatorSlots: 1
});

// Create scales
const scale = new Scale({
    type: 'logarithmic',
    leftIndex: 1,
    rightIndex: 10
});

// Render scales
slideRule.render(scale, {
    component: SlideRule.SLIDE,
    slot: 0,
    name: 'C',
    marks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
});
```

## Demo

Open `index.html` to see a working slide rule with A, B, C, and D scales.
