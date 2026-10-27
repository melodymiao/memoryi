# Design reference (read-only)

These files are exported from the Claude Design canvas and are the **source of truth for the UI**. Don't edit them.

| File | Screen |
|---|---|
| Home.html | Home tab |
| Trips.html | Trips tab (interactive: calendar paging, collapsible plans, past-ticket stack) |
| Plans.html | Plans tab (interactive: location dropdown, type chips, pinning, new-idea sheet) |
| Passport.html | Passport tab |
| StampDetail.html | Stamp scrapbook page (opened from a stamp) |
| Ticket.html | Shared ticket component, used by Trips (main ticket + past stack) |

## How to read them
- They use a canvas templating format, so **they won't render on their own** (the `support.js` runtime isn't included). Read them as specs.
- **Inline `style="…"` attributes hold the exact values**: colors, font sizes, line heights, letter spacing, padding, gaps, radii and shadows. Copy these values; don't eyeball them.
- `{{name}}` is a placeholder filled from the script at the bottom of each file. `<sc-for>` is a loop, `<sc-if>` is a conditional, and `<dc-import name="Ticket">` embeds Ticket.html.
- The `<script type="text/x-dc">` block at the bottom holds **sample data and the interaction logic** (calendar math, the stack ordering, filters). Use it to understand behavior, not as code to copy; real data comes from `src/data/`.
- Each root is fixed at 390px wide (iPhone width), and the height is just the canvas frame. Real screens scroll, and the tab bar is fixed to the bottom of the viewport.
- Links like `href="Trips.dc.html"` mean "navigate to that tab or screen".
- Text in [brackets] is placeholder content.
