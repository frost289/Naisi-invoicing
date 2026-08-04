# Naisi Foods Invoicing

Naisi Foods Invoicing is a lightweight internal web app for managing sales invoices. It lets staff create, view, edit, delete, and download invoices as professional Word documents without requiring authentication.

## Features

- Create invoices with customer details, terms, and dynamic line items
- Auto-calculate running totals and grand totals
- Auto-generate invoice numbers in the format `NF-INV-YYYY-000X`
- View all invoices in a live Firestore-backed dashboard
- Search invoices by customer name or invoice number
- Edit existing invoices in place
- Delete invoices with a confirmation modal
- Download invoices as `.docx` files client-side
- Responsive UI with polished cards, motion effects, and empty/loading states

## Tech Stack

- React + Vite
- Tailwind CSS
- Firebase Firestore (modular SDK v9+)
- `docx` for Word document generation
- `file-saver` for browser downloads
- Framer Motion for subtle UI animations

## Project Structure

```text
src/
  components/
    ConfirmModal.jsx
    DownloadButton.jsx
    InvoiceCard.jsx
    InvoiceForm.jsx
    InvoiceList.jsx
  utils/
    calculateTotal.js
    generateDocx.js
  App.jsx
  firebase.js
  main.jsx
  index.css
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root with your Firebase config values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Set up Firestore

Make sure your Firebase project has Firestore enabled and a collection named `invoices`.

For local development or a simple internal tool, you can use permissive rules such as:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /invoices/{invoiceId} {
      allow read, write: if true;
    }
  }
}
```

> This is suitable for an internal tool where anyone with the app link should have access.

### 4. Run the app locally

```bash
npm run dev
```

Then open the Vite URL shown in the terminal (usually `http://localhost:5173`).

## Build for Production

```bash
npm run build
```

The production build will be generated in the `dist/` folder.

## Notes

- The app stores invoices in Firestore under the `invoices` collection.
- Word files are generated entirely in the browser using the `docx` package.
- Invoice numbers are generated from the current year and the highest existing invoice number in the collection.

