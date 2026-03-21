# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
