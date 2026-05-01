<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design system

Before writing any UI (components, pages, styling), read [DESIGN.md](DESIGN.md).
It defines the cream canvas, the five-pastel role mapping, the `.article-prose`
reading surface, and the component patterns actually in use. Reference tokens
from [src/app/globals.css](src/app/globals.css); never inline raw hex values
that aren't already in the token set.
