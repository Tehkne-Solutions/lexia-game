# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2024-03-21

### Added

- Voice feedback system using Web Speech API for Portuguese (Brazil) audio guidance
- useVoice hook for speech synthesis with configurable rate and pitch for child-friendly voice
- Automatic welcome messages when new letters are introduced
- Success and encouragement audio feedback for correct/incorrect drawings
- Voice integration with FSRS evaluation system

### Changed

- Level unlocking now based on average FSRS stability > 0.85 instead of streak count
- Curriculum ordering optimized for motor complexity and phonetic difficulty
- DrawingCanvas now uses evaluation result callback instead of direct success handling
- App.tsx integrates voice feedback with curriculum progression

### Technical Details

- Added `src/hooks/useVoice.ts` for Web Speech API integration
- Modified `useAlphabet.ts` to use stability-based level progression
- Updated `curriculum.ts` with reordered letters for optimal learning sequence
- Refactored evaluation flow to centralize feedback in App component

## [0.3.0] - 2024-03-21

### Added

- Pedagogical curriculum system with 4 difficulty levels based on Brazilian literacy best practices
- Anchor words and emojis for each letter (e.g., "A de Abelha" 🐝)
- Level progression system that unlocks new letters only after mastering current level
- AnchorDisplay component for visual letter association
- Curriculum data structure with high-frequency words from Lex2Kids
- Intelligent letter selection prioritizing FSRS review needs and level progression

### Changed

- useAlphabet hook now uses curriculum-based progression instead of alphabetical order
- App.tsx redesigned with proper Material-UI theming and component integration
- Letter selection algorithm considers both FSRS scheduling and pedagogical levels

### Technical Details

- Added `src/data/curriculum.ts` with structured learning progression
- Added `src/components/AnchorDisplay.tsx` for visual anchors
- Refactored `useAlphabet.ts` to support level-based unlocking
- Integrated curriculum with FSRS for optimal learning scheduling

## [0.2.0] - 2024-03-21

### Added

- Handwriting Recognition integration using experimental Handwriting Recognition API
- Automatic evaluation system that replaces manual grade buttons when API is supported
- Stroke collection and processing for canvas drawings
- Fallback to manual evaluation when HWR API is not available
- Visual indicators for automatic vs manual evaluation modes
- Enhanced drawing canvas with stroke tracking for better recognition

### Changed

- Drawing validation now attempts automatic recognition before falling back to manual grading
- Canvas component now collects stroke data for HWR processing

### Technical Details

- Added `src/lib/recognition.ts` for HWR API integration
- Added `src/hooks/useEvaluation.ts` for intelligent grading logic
- Modified `DrawingCanvas.tsx` to collect and process drawing strokes
- Implemented graceful degradation for unsupported browsers

## [0.1.0] - 2024-03-21

### Added

- Initial implementation of FSRS (Free Spaced Repetition Scheduler) algorithm for intelligent learning scheduling
- Drawing canvas component for letter practice with manual grade evaluation
- Voice synthesis using Web Speech API for Portuguese feedback and celebrations
- Material-UI theming with tribal/cabalistic elements for gamified experience
- Progress tracking and persistence using LocalStorage
- Confetti animations for successful attempts
- Basic React app structure with Vite build system
- TypeScript configuration and project setup

### Fixed

- Compilation issues with MUI imports
- Vite SPA routing configuration
- TypeScript configuration conflicts
