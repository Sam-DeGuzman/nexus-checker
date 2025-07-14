# Nexus Checker Widget

## Embeddable Usage

To embed the Nexus Checker widget on any website (including Webflow), add the following to your page:

```html
<!-- Place this where you want the widget to appear -->
<div id="nexus-checker-widget-root"></div>
<script src="https://your-cdn.com/path/to/embed.js"></script>
```

- The widget will automatically render inside the div with id `nexus-checker-widget-root`.
- You can change the script `src` to point to your hosted `embed.js` file (from the `dist` folder after build).
- The widget is fully isolated and will not conflict with host site styles.

## Development

- `npm run dev` — Start local dev server with HMR
- `npm run build:widget` — Build production single-file embeddable bundle in `dist/embed.js`

## Customization
- All widget styles are prefixed with `tw-` and scoped for isolation.
- To change the mount point, update the `WIDGET_ID` in `src/embed.js`.
