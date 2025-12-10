# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-10

### Added
- **Stable Release** - First production-ready version of Chaindoc Embed SDK
- Modal and inline display modes for signature flows
- PostMessage-based secure communication with iframe
- Event callbacks: `onSuccess`, `onError`, `onCancel`, `onReady`, `onClose`
- Theme switching (light/dark mode)
- Localization support for 14 languages (en, ru, uk, pl, de, es, pt, fr, et, kk, zh, hi, tr, vi)
- Full TypeScript support with type definitions
- CDN distribution via unpkg and jsDelivr
- UMD, ESM, and CommonJS build outputs
- Zero runtime dependencies

### Changed
- Simplified SDK configuration - removed `baseUrl` property (environment-based URLs are now automatic)
- Updated embed domains for production, staging, and development environments

### Security
- Origin validation for postMessage communication
- Sandboxed iframe with minimal required permissions

---

## Pre-release History

### [0.1.0-alpha.13] - 2024-12-10
- Updated iframe base URLs to new embed domains for all environments

### [0.1.0-alpha.12] - 2024-12-09
- Removed `baseUrl` property from configuration (breaking change)
- Simplified SDK setup - URLs are now determined automatically by environment

### [0.1.0-alpha.11] - 2024-12-08
- Added localization support with 14 languages
- Added `language` option to signature flow configuration

### [0.1.0-alpha.10] - 2024-12-07
- Added CDN support (unpkg, jsDelivr)
- Updated installation documentation

### [0.1.0-alpha.9] - 2024-12-06
- Added UMD/IIFE build for CDN usage
- Refactored build configuration

### [0.1.0-alpha.8] - 2024-12-05
- Updated documentation URLs and support contacts

### [0.1.0-alpha.1 - 0.1.0-alpha.7] - 2024-12
- Initial alpha releases
- Core SDK implementation
- Documentation and framework guides

[1.0.0]: https://github.com/ChaindocIO/embed-sdk/releases/tag/v1.0.0
[0.1.0-alpha.13]: https://github.com/ChaindocIO/embed-sdk/releases/tag/v0.1.0-alpha.13
