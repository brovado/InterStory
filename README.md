# InterStory — Adventure Nexus

A browser-first, reusable interactive fantasy RPG launcher built using HTML, CSS, JavaScript, and JSON.

## Status — v0.1 local-first prototype

Implemented:
- Nine selectable adventure modules
- Character creation and character selection
- Editable attributes, equipment, skills, quest notes, and resources
- Turn directive builder with free-text action and experimentation fields
- Manual recording of turn results in a persistent journal
- Local browser saving using localStorage
- JSON import/export for backups and moving between devices
- Mobile-responsive interface

Not yet implemented: OpenAI API integration, automatic AI turn resolution, server-backed/cloud character synchronization, AI-generated dynamic UI schemas, login, or authentication. The interface explicitly shows **LOCAL MODE · AI OFFLINE**.

## Activate GitHub Pages

Repository Settings → Pages → Build and deployment → Deploy from a branch → main → /(root).

The URL will appear in the GitHub Pages settings once publishing completes. Do not guess the published URL until the site is enabled.

## Persistence

Saves live in this device's browser localStorage. Switching browsers/devices, private browsing, or clearing browser data may make them unavailable. Export the JSON backup regularly. Import on another device to continue there. A later release can use the private `InterStoryBackend` repository for synchronized saves.

## Security boundaries

This repository is **public**. NEVER commit OpenAI API keys, GitHub personal access tokens, session credentials, private character data, or a private backend configuration here.

GitHub Pages is static; it cannot securely keep an API key or write directly to a private repository. The public browser cannot safely initiate private Actions workflows without some authorized broker. The private backend repository can store backend code and GitHub Actions secrets, but this alone does not create a browser-callable authenticated API.

## App files

- `index.html` — app layout.
- `styles.css` — responsive fantasy design.
- `app.js` — character management, turns, local saves, import/export.
- `adventures.json` — reusable module descriptions.

## Next release target

One secure turn-processing round trip: submit directives, invoke the game master with OpenAI using a server-side secret, validate a structured response, persist the updated character, and render the next turn's narrative and controls. Choose and validate the safe connection mechanism before putting credentials anywhere.

## Source of gameplay specification

[Adventure Nexus — Universal RPG Engine](https://chatgpt.com/space/page_7346e4700d30819197fd0f4888a6b270).
