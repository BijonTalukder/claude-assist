export { ProjectScanner } from './project-scanner.js';
export type { ProjectScanResult } from './project-scanner.js';

export { FrameworkDetector } from './detectors/framework-detector.js';
export type { PackageJsonShape } from './detectors/framework-detector.js';
export { LanguageDetector } from './detectors/language-detector.js';
export { PackageManagerDetector } from './detectors/package-manager-detector.js';

export { ProjectStatsCollector } from './stats/project-stats-collector.js';
export type { CollectedFiles } from './stats/project-stats-collector.js';

export { BUILD_OUTPUT_FOLDER_NAMES, DEFAULT_IGNORE_PATTERNS, SOURCE_EXTENSIONS } from './constants.js';
