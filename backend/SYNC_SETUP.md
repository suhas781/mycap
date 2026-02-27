# Google Sheets sync setup

To use **Sync from sheet** (pull leads from Google Sheets into the app), you need a Google Cloud **service account** and its JSON key.

## 1. Create a Google Cloud project (if you don’t have one)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.

## 2. Enable Google Sheets API

1. In the console: **APIs & Services** → **Library**.
2. Search for **Google Sheets API** and enable it.

## 3. Create a service account

1. **APIs & Services** → **Credentials** → **Create credentials** → **Service account**.
2. Give it a name (e.g. `mycap-sync`) and finish.
3. Open the new service account → **Keys** tab → **Add key** → **Create new key** → **JSON**.
4. Save the downloaded JSON file somewhere safe (e.g. `backend/service-account.json`).

## 4. Share your Google Sheet with the service account

1. Open the JSON file and copy the **client_email** (e.g. `something@project-id.iam.gserviceaccount.com`).
2. In Google Sheets, open the spreadsheet you use as a lead source.
3. Click **Share** and add that email as a **Viewer** (read-only is enough).

## 5. Configure the backend

In `backend/.env`, set **one** of:

**Option A – path to the JSON file (recommended):**

```env
GOOGLE_CREDENTIALS_PATH=./service-account.json
```

Put the JSON file in the `backend` folder (or use another path; `./` is relative to where you start the server).

**Option B – paste the JSON in .env:**

```env
GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com",...}'
```

Use the full JSON as a single line; wrap in single quotes so the key’s newlines work.

## 6. Add sheets in the app

- In the **HR dashboard**, use **Add new sheet**: name, team leader, and the **Google Sheet ID** from the sheet URL  
  `https://docs.google.com/spreadsheets/d/<THIS_IS_THE_SHEET_ID>/edit`
- Team leads will see that sheet under **View sheet** and can use **Sync from sheet** to pull leads.

## Security

- Do **not** commit the JSON key or `.env` to git. Add to `.gitignore`:
  - `.env`
  - `service-account.json` (or whatever path you use).
