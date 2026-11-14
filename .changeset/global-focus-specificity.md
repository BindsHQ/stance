---
'@bindshq/stance-react': patch
---

The default focus ring in global.css now has zero specificity, so it never draws a second ring over a component that shows its own focus indicator, such as the command palette input.
