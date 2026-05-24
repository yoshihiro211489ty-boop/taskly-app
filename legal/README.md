# Legal Documents — Operator Guide

This directory contains the legal documents required for the Taskly (タスクリー) App Store submission and Japanese legal compliance.

| File | Description |
|---|---|
| `privacy-policy.ja.md` | Privacy Policy (Japanese) |
| `privacy-policy.en.md` | Privacy Policy (English) |
| `terms-of-service.ja.md` | Terms of Service (Japanese) |
| `terms-of-service.en.md` | Terms of Service (English) |
| `tokushoho.ja.md` | 特定商取引法に基づく表記 (Japanese Specified Commercial Transactions Act disclosure) |

---

## Step 1: Fill In All Placeholders

Before publishing, replace every `[placeholder]` listed in the checklist below.

### Placeholders Checklist

**All files:**
- [ ] `[運営者名]` — Your business or personal name as the app operator (e.g., 山田太郎 / Taro Yamada, or your company name)
- [ ] `[YYYY年MM月DD日]` / `[YYYY-MM-DD]` — The effective date (the date you first publish these documents)
- [ ] `[サポートメールアドレス]` / `[support email address]` — A dedicated support email address (e.g., support@yourapp.jp)
- [ ] `[住所]` / `[Address]` — Your business or registered address

**privacy-policy.ja.md / privacy-policy.en.md:**
- [ ] Confirm the list of third-party analytics/crash tools (the policy currently lists "Sentry" as an example — replace with whatever you actually use, e.g., Firebase Crashlytics, Bugsnag, or remove if not applicable)

**terms-of-service.ja.md / terms-of-service.en.md:**
- [ ] Review the free vs. premium feature breakdown in Section 7-1 once your pricing tiers are finalized

**tokushoho.ja.md:**
- [ ] `[代表者氏名]` — The full legal name of the representative / individual operator
- [ ] `[電話番号]` — A phone number (if you prefer not to display it publicly, change the text to the "available upon request" format already shown in the template)

---

## Step 2: Publish the Documents

Apple requires that the Privacy Policy URL and Terms URL be **publicly accessible on the web** before you can submit your app.

### Option A — Quick (Recommended Before First Submission)

Use **Notion** as a free, fast host:

1. Copy the Markdown content of each document into a new Notion page.
2. In Notion, click **Share → Publish to web** → enable **"Allow search engines to index this page"**.
3. Copy the public URL (e.g., `https://www.notion.so/Privacy-Policy-xxxxxx`).
4. Paste the URL into the relevant field in App Store Connect.

**Tip**: Create a single Notion page as a legal hub, and link to the individual policy pages from there. Use that hub URL as your "Support URL" in App Store Connect.

### Option B — Long-Term (Recommended After Launch)

Register a domain (e.g., `taskly.app`, `tasukuri.jp`, or a subdomain of your existing domain) and host the documents with clean URLs:

```
https://yourdomain.com/privacy      ← Privacy Policy
https://yourdomain.com/terms        ← Terms of Service
https://yourdomain.com/tokushoho    ← 特定商取引法表記
```

Simple hosting options: GitHub Pages, Vercel (a `vercel.json` is already in this repo), Netlify, or a static page within your marketing site.

---

## Step 3: Set URLs in App Store Connect

Log in to [App Store Connect](https://appstoreconnect.apple.com) → Your App → **App Information**.

| Field | URL to use |
|---|---|
| **Privacy Policy URL** | URL to your published Privacy Policy (Japanese or English — either is accepted; linking the Japanese version is safest for Japanese law compliance) |
| **Terms of Use URL** | URL to your published Terms of Service |
| **Support URL** | URL to a support page, or a `mailto:` link (e.g., `mailto:support@yourapp.jp`) |

---

## Step 4: App Store Privacy Nutrition Label

In App Store Connect → Your App → **App Privacy**, declare the following based on your Privacy Policy.

### Data Types to Declare

| Data Type | Category | Linked to Identity | Used for Tracking |
|---|---|---|---|
| Email Address | Contact Info | Yes | No |
| Name (display name) | Contact Info | Yes | No |
| User ID | Identifiers | Yes | No |
| Product Interaction (feature usage) | Usage Data | Yes | No |
| Crash Data | Diagnostics | No | No |
| Performance Data (app launch times, etc.) | Diagnostics | No | No |
| User Content (tasks, notes, routines) | User Content | Yes | No |
| Coarse Location | — | — | — |

**"Used for Tracking"** should be **No** for all items as long as you are not using data for cross-app advertising attribution (e.g., not using Meta Pixel, TikTok SDK for ads, etc.).

**"Linked to Identity"** should be **Yes** for data that is associated with a logged-in user account, and **No** for purely anonymous diagnostic data.

> If you add any advertising SDK (AdMob, Meta Audience Network, etc.) in the future, you will need to re-declare data and set "Used for Tracking" to Yes for the relevant types, and add an App Tracking Transparency (ATT) prompt.

---

## Step 5: 特定商取引法 (Tokushoho) — Where to Display

The `tokushoho.ja.md` content must be accessible from **within the app** as well as via a public URL. Recommended locations:

- In-app: **Settings → Legal → 特定商取引法に基づく表記**
- Web: `https://yourdomain.com/tokushoho`

This is a Japanese legal requirement for apps selling digital goods to Japanese users.

---

## Legal Review Reminder

These documents are well-structured starting templates covering the key legal areas for a Japanese-market mobile app with in-app purchases. However, they are **not a substitute for professional legal advice**.

Before you reach significant scale (e.g., tens of thousands of users, enterprise customers, or venture funding), we strongly recommend having these documents reviewed by a lawyer experienced in **Japanese IT law** and **consumer protection law** (消費者契約法, 個人情報保護法, 特定商取引法).

For early-stage launch, these documents provide a solid and legally-aware foundation.

---

## Document Versioning

When you update any document:
1. Increment the version number (e.g., 1.0 → 1.1 for minor changes, 2.0 for major changes).
2. Update the effective date.
3. Notify users as required (14 days notice for material changes, per the policy text).
4. Keep previous versions archived in a `legal/archive/` subdirectory for your records.
