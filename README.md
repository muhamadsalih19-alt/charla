# Charla

A Latin American Spanish tutor that runs as an installable web app (PWA). Talk with Sofi, an
AI tutor powered by Claude who adapts to your level, or work through lessons, drills and a daily
spaced-repetition review.

- **Hablar:** spoken conversations (scenarios, free chat, "ask Sofi"), with inline corrections and a review at the end.
- **Practicar:** 10 units from A1 to B1, AI-generated drills, and a daily review of words and mistakes.
- **Adaptive:** a placement chat sets your level; every session updates your profile.
- **Reminders:** a daily push notification, sent by the `Daily reminder` GitHub Actions workflow.

The Claude API key is entered in the app and stored only on the device. It is never in this repo.

## Develop

```bash
npm install
npm run dev
```

`npm run build` outputs to `dist/`. Pushing to `main` deploys to GitHub Pages.

## Daily reminder setup

Repo secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `REMINDER_CODE` (copied from the app's
Settings → Daily reminder). The workflow runs hourly and only sends at the hour you picked.

## Credits

Sofi's 3D model is the "brunette" avatar from [TalkingHead](https://github.com/met4citizen/TalkingHead) (created with Ready Player Me, CC BY-NC 4.0, non-commercial use). 3D animation and lip-sync by TalkingHead (MIT).
