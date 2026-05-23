# WillCrafty Security And Privacy

> WillCrafty is designed as a static, privacy-preserving drafting app with no server-side storage of will draft data in the core builder.

## Privacy Principles

- Draft data stays in the browser during the session.
- No account is required for the free draft.
- Users download and control their own documents.
- The app separates the private will builder from optional external services.

## Security Practices

- Static app architecture for the core drafting flow.
- No geolocation, camera, or microphone permissions.
- Clear legal and AI disclaimers.
- Environment variables are used for serverless integrations such as AI routing and checkout.
- Sensitive keys are not committed to the repository.

## User Responsibilities

- Review local signing and witness rules.
- Print and sign the will properly.
- Store the signed original safely.
- Tell trusted people where the original is stored.
- Avoid pasting sensitive information into AI prompts unless intentional.
