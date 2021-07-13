# Env vars

```
NODE_ENV=production

BOOST_HUB_BASE_URL=
SSE_URL=
REALTIME_URL=

STRIPE_PUBLISHABLE_KEY=
GITHUB_OAUTH_ID=
GOOGLE_CLIENT_ID=
INTERCOM_APP_ID=cvsnhh77

AMPLIFY_AUTH_IDENTITY_POOL_ID=
AMPLIFY_AUTH_REGION=
AMPLIFY_PINPOINT_APPID=
AMPLIFY_PINPOINT_REGION=
```

# Dev mode

## 1. Set up in BoostHub repo

Update env vars below.

```
CLOUD_SPACE_FRONTEND_URL=http://localhost:3004
```

Run dev server.

```
npm run dev
```

## 2. Set up in BoostNote.next repo

Update env vars(Same to above).

```
BOOST_HUB_BASE_URL=http://localhost:3001
SSE_URL=http://localhost:3002
REALTIME_URL=ws://localhost:3003
```

Open terminals for each script and run it.

```
npm run dev:webpack
```

```
npm run dev:cloud
```

```
npm run dev:electron
```

# Cloud Only Dev Mode

If you don't need to modify any source code of the electron main processor and the local space, you can compile those source code in advance and run a single webpack processor just for one of the cloud space.

## 1. Set up in BoostHub repo(Same to Dev Mode)

Update env vars below.

```
CLOUD_SPACE_FRONTEND_URL=http://localhost:3004
```

Run dev server

```
npm run dev
```

## 2. Set up in BoostNote.next repo

Update env vars(Same to Dev Mode)

```
BOOST_HUB_BASE_URL=http://localhost:3001
SSE_URL=http://localhost:3002
REALTIME_URL=ws://localhost:3003
```

Open terminals for each script and run it.

```
npm run dev:cloud
```

```
npm run build:electron
npm start
```

# Deployment (Cloud Space Only)

Update env vars

```
BOOST_HUB_BASE_URL=https://boostnote.io
SSE_URL=https://realtime.boostnote.io
REALTIME_URL=wss://collaboration.boostnote.io
```

Build the cloud side.

```
npm run build:cloud
```

Deploy via vercel.

```
vercel compiled-cloud
```

Set up alias for the deployment.

```
vercel alias DEPLOYMENT_URL TARGET_URL
```
