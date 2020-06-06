# Codenames

In order to run this locally, you'll want to configure some environments for the Client and the Functions. Both of these are available in in the Firebase console under project settings.

## Client

Setup the firebase enviornment variables that you can find in `client/.env.sample`. There are available in the Firebase console under project settings > SDK config.

Additionally, you'll want to set the local functions url after you locally serve your functions.

Run locally with `yarn local`.

## Server

Create a folder named `secrets/` and place your `firebase_service_account_key.json`. This is available in the Firebase console under project settings > service accounts.

run locally with `yarn local`.