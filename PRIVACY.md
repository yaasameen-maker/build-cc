# Privacy Policy

**build.cc** — last updated June 2, 2026

This document explains in plain English what data build.cc collects, what we store, what we discard, and how you can delete your data.

---

## Who we are

build.cc is a build pipeline command center for developers and technical founders. It is operated by Yaasameen Perez. Questions? Email **yaasameen.perez@pursuit.org**.

---

## What we collect and why

### When you sign in

Sign-in is handled through **GitHub OAuth**. When you authenticate, GitHub shares:

| Data | How we use it |
|---|---|
| Your name | Displayed in the app navigation |
| Your email address | Used as your account identifier |
| Your GitHub avatar URL | Displayed in the app navigation |
| Your GitHub user ID | Links your account to your builds |
| A GitHub OAuth access token | Used to read your repositories when you run a sync |

We store all of the above in our database. Your access token is stored securely and is only used to call the GitHub API on your behalf.

### GitHub OAuth scope

The app requests the **`repo`** scope from GitHub. This grants read and write access to your repositories (public and private). We use it **read-only** — to scan file trees, read dependency files, and fetch recent commits, pull requests, and issues. We never write to, modify, or delete anything in your repositories.

If you only plan to link public repositories, you can revoke and reauthorize at any time through [GitHub's authorized apps settings](https://github.com/settings/applications).

### When you create a build

When you create a build and optionally link a GitHub repository, we store:

- The build name you enter
- The repository name (e.g., `owner/repo`)
- Your manual checklist state (which items you've checked)
- Deployment URLs and platform names you enter (e.g., Vercel URL, Railway dashboard)

### When you run a sync

Clicking **sync** triggers a scan of your linked repository. Here is exactly what happens:

| Data | Stored? |
|---|---|
| Full file path list | **No** — read in memory, discarded after analysis |
| `package.json` content | **No** — read to detect dependencies, then discarded |
| `requirements.txt` / `pyproject.toml` content | **No** — same as above |
| `.github/workflows/*.yml` content | **No** — same as above |
| Last 15 commit messages, author names, and dates | **Yes** — displayed in the GitHub tab |
| Up to 5 open pull request titles, authors, and dates | **Yes** — displayed in the GitHub tab |
| Up to 5 open issue titles and dates | **Yes** — displayed in the GitHub tab |
| Auto-detected tech stack signals | **Yes** — used to auto-verify checklist items |

We never read, store, or transmit your source code, secret files, or any file content beyond the dependency and workflow files listed above.

---

## What we do not do

- We do not sell your data to anyone.
- We do not use your data for advertising.
- We do not include any third-party analytics or tracking scripts.
- We do not use Google Sign-In or any Google authentication. Any "Continue with Google" option you see during sign-in is displayed by GitHub on their own login page — our app communicates only with GitHub.
- We do not write to, modify, or delete your GitHub repositories.
- We do not share your data with any party other than the infrastructure providers listed below.

---

## Infrastructure and data location

| Service | Purpose |
|---|---|
| **Railway** | Hosts our PostgreSQL database and Python API. Your data is stored in Railway's infrastructure. |
| **Vercel** | Hosts the web application. Vercel processes requests but does not persistently store your data. |
| **GitHub** | OAuth provider and repository data source. |

Both Railway and Vercel are SOC 2 compliant providers.

---

## Sessions and cookies

We use a single session cookie to keep you logged in. It contains only a session token — no personal data. Sessions expire automatically.

---

## Data deletion

**Builds:** You can delete any build at any time from the builds list. This permanently removes the build and all associated checklist data, signals, and GitHub activity data.

**Account:** To delete your account and all associated data, email **yaasameen.perez@pursuit.org** with the subject line "Account deletion request." We will delete your account within 7 days and confirm by email.

You can also revoke build.cc's access to your GitHub account at any time from [GitHub's authorized apps page](https://github.com/settings/applications). This prevents future syncs but does not delete data already stored.

---

## Changes to this policy

If we make material changes to what data we collect or how we use it, we will update the date at the top of this document. Continued use of the app after changes constitutes acceptance of the updated policy.

---

## Contact

Privacy questions or requests: **yaasameen.perez@pursuit.org**
