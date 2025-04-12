# Glitch Deployment To-Do List

**Phase 1: Prepare Project Locally for Glitch**

- [x] **1. Merge Dependencies:**
  - **Files:** Root `package.json`, `server/package.json`
  - **Action:** Copy dependencies from `server/package.json` into the root `package.json`. Delete `server/package.json`. Run `npm install` in the **root** directory.
- [x] **2. Adjust Root `package.json` Scripts:**
  - **File:** Root `package.json`
  - **Action:** Ensure `"build": "react-scripts build"` exists. Change `"start"` script to `"start": "node server/server.js"`.
- [x] **3. Modify Server to Serve Frontend:**
  - **File:** `server/server.js`
  - **Action:** Add `require('path')`. Add `express.static` middleware pointing to the `build` folder (using `path.join(__dirname, '..', 'build')`). Add catch-all route `app.get('*', ...)` to serve `build/index.html`.
- [x] **4. Build Frontend:**
  - **Action:** Run `npm run build` in the **root** directory. Verify a `build` folder is created.

**Phase 2: Deploy to Glitch**

- [ ] **5. Create Glitch Project:**
  - **Action:** Go to Glitch.com. Create a new project, preferably by importing your GitHub repository (ensure all changes from Phase 1, including the `build` folder, are committed and pushed first). Alternatively, create a basic project and upload/copy files manually.
- [ ] **6. Update Frontend Connection URL (on Glitch or before push):**
  - **File:** `src/components/GameCanvas.tsx`
  - **Action:** Change the `serverUrl` variable inside the network `useEffect` hook to `const serverUrl = window.location.origin;`.
  - **Re-build (if edited locally):** If you edited this locally _after_ the initial build, run `npm run build` again before pushing/uploading.
- [ ] **7. Test Glitch Deployment:**
  - **Action:** Check Glitch logs for server start messages. Open the Glitch Live Site URL. Check browser console for `[Client] Connected...` message. Send the Live Site URL to your friend and verify they can connect too (check Glitch logs/browser consoles).
