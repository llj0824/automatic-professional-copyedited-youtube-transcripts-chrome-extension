# 🛠  Feature clip-service

## 1 Goal
Add a **Clip** button to the extension popup that lets users enter start + end times and download that slice of the current YouTube video as an MP4, powered by our self‑hosted **yt‑clipping‑service**.

## 2 Acceptance Criteria
- [ ] **UI**: Clip button appears in the popup whenever a YouTube watch page is active.  
- [ ] **Form**: Inline `HH:MM:SS` start / end inputs (prefilled with current player time).  
- [x] **Validation**: 1 s ≤ length ≤ 5 min; end > start; inputs are valid time strings.  (`clipServiceUtils.js` implements this)
- [x] **API Call** (default key baked in):  (API spec defined in `clip_api_service.md`)
  POST /get_video
  Headers: X‑API‑Key: <DEFAULT_KEY>
  Body: { url, start_time, end_time, video_format:"bestvideo", audio_format:"bestaudio" }
  (See `clip_api_service.md` for full API details)
  
- [x] **Progress**: Poll `GET /status/{taskId}` every 2 s; spinner & ETA. (API spec defined)
- [x] **Download**: On `status:"completed"`, stream via `chrome.downloads.download` as `{videoId}-{start}-{end}.mp4`. (API spec defined, client needs to form URL from `/files/...` path)
- [x] **Retention**: Service keeps clips ≤10 min then auto‑deletes. (API spec defined)
- [ ] **Tests**: All new tests pass; legacy suite unchanged.

## 3 Tech Guard‑Rails
| Layer   | Constraints |
|---------|-------------|
| Frontend | Embed form inside existing popup; no new MV3 permissions. Default key stored obfuscated in `keys.js` (mirrors current LLM key pattern). |
| Backend  | Deploy fork of **yt‑clipping‑service** (Flask + yt‑dlp + FFMPEG) on Cloud Run (1 vCPU, 1 GiB). Build via repo Dockerfile. |
| Shared   | Only `axios` & `zod` additions allowed without @leo sign‑off. Container must build on `linux/amd64`. |

## 4 Test Charter
TDD (red → green).  
- Frontend: Vitest + Testing Library (`__tests__/clipButton.spec.ts`).  
- Backend stub: Docker‑compose service in CI; Jest E2E (`tests/clipApi.e2e.ts`).  

## 5 Deliverables
1. New `__tests__/…` / `tests/…` (fail first).  
2. `clip-service.patch.diff`.  
3. CHANGELOG entry under **[Unreleased]**.  
4. PR body with *How to Test*  steps.  
```
