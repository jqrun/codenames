# Codenames

An online version of the popular game Codenames! I created this to practice going through all the motions of building and launching a modern web app for the first time. Core technologies used are React and Firebase.

![Demo Picture](/client/public/demo.png)

## Running Locally

In order to run this locally, you'll want to configure some environments for the Client and the Functions. Both of these are available in in the Firebase console under project settings.

### Client

Setup the firebase enviornment variables that you can find in `client/.env.sample`. There are available in the Firebase console under project settings > SDK config.

Additionally, you'll want to set the local functions url after you locally serve your functions.

Run locally with `yarn local`.

### Server

Create a folder named `secrets/` and place your `firebase_service_account_key.json`. This is available in the Firebase console under project settings > service accounts.

run locally with `yarn local`.