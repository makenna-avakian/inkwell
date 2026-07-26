# Dependencies

## Internal Dependencies

```mermaid
flowchart LR
    Frontend["shareart-frontend"] -.->|"no integration today"| Backend["shareart-backend (empty)"]
```

No internal (in-repo package-to-package) dependencies exist — each repo is a single, un-split codebase.

## External Dependencies

### next (15.5.4)
- **Version**: 15.5.4
- **Purpose**: Application framework.
- **License**: MIT

### react / react-dom (19.1.0)
- **Version**: 19.1.0
- **Purpose**: UI library, required by Next.js 15.
- **License**: MIT

### framer-motion (^12.23.22)
- **Version**: ^12.23.22
- **Purpose**: Animations.
- **License**: MIT

### tailwindcss (^4)
- **Version**: ^4
- **Purpose**: Utility-first CSS.
- **License**: MIT

### @tanstack/react-router (^1.132.37)
- **Version**: ^1.132.37
- **Purpose**: Unused — no routing usage found in source; App Router is used instead.
- **License**: MIT
