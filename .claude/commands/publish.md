---
description: Publish article to all platforms (WeChat, XHS, Zhihu)
---

You are publishing a converted article to one or more platforms.

**Prerequisite**: `/convert` must have been run first. The article directory should contain:
`weixin.html`, `xhs.md`, `zhihu.md`, `english.md`, `images/`

# Instructions

## Step 1 — Locate the article

Find the article directory (same as /convert — detect from current working directory or ask).
Verify all required files exist. If any are missing, tell the user to run `/convert` first.

## Step 2 — Ask which platforms

Ask: "Publish to which platforms?"
Options: **All** / WeChat / Xiaohongshu / Zhihu (multi-select allowed)

If the user says "all" or doesn't specify, use all three.

## Step 3 — Publish to each platform (one by one)

**CRITICAL**: Publish platforms sequentially (one at a time), not in parallel.

For each selected platform:
1. Complete the full publishing workflow for that platform
2. Get user confirmation or completion signal before moving to the next
3. Report success or failure clearly before proceeding

**Sequential order** (if all selected):
1. WeChat (manual paste + publish)
2. Xiaohongshu (manual upload + publish)
3. Zhihu (manual paste + publish)

This allows the user to work through each platform methodically and pause if needed.

---

### WeChat (微信公众号)

Open the WeChat MP dashboard in Edge:

```bash
open -a "Microsoft Edge" "https://mp.weixin.qq.com"
```

Then tell the user:
1. Click **图文消息** or **新建图文** to start a new article
2. Open `weixin.html` in another browser tab — Cmd+A, Cmd+C to copy the body content
3. Paste into the WeChat editor (the title is NOT in the HTML body — set it in the WeChat title field)
4. Upload cover image: `images/cover-weixin.jpg`
5. Section images are already embedded inline in the HTML — no need to upload separately
6. Click 发布 when ready

Report: `✓ WeChat — editor opened, ready for manual paste and publish`

---

### Xiaohongshu (小红书)

Open the XHS publish page in Edge:

```bash
open -a "Microsoft Edge" "https://www.xiaohongshu.com/publish/publish"
```

Read `xhs.md` and display the full content to the user clearly — title on one line, body below.

Also tell the user which images to upload (in order):
1. `images/cover-xhs.jpg` (cover)
2. `images/section-1.jpg`
3. `images/section-2.jpg`
4. `images/section-3.jpg` (if exists)

Tell the user: "XHS publish page is open in Edge. Copy the title and body above, upload the images in order, paste content, add hashtags, and publish."

Report: `✓ Xiaohongshu — editor opened, ready for manual publish`

---

### Zhihu (知乎)

Open Zhihu write page in the default browser:
```bash
open "https://zhuanlan.zhihu.com/write"
```

Read `zhihu.md` content. Display it to the user and say:
"Zhihu editor is open. The article content is shown above — please paste it (Cmd+V after clicking into the editor) and click 发布."

Then wait for user confirmation.

Report: `✓ Zhihu — ready for manual publish`

---

## Step 4 — Final report

After each platform, confirm before moving to the next. After all selected platforms are complete:

```
✓ Publishing complete: [article title]

Platform results:
  WeChat         ✓  Draft published
  Xiaohongshu    ✓  Published
  Zhihu          ✓  Manually published

```

If the user opted for selective publishing (not all platforms), report only the platforms that were published.

# Important

- **Sequential publishing**: Complete one platform fully before moving to the next
- **User confirmation**: After each platform, confirm success before proceeding to the next
- **Selective publishing**: It's OK to publish to only some platforms (e.g., just WeChat, or WeChat + Zhihu)
- WeChat: do NOT auto-click publish — always leave final publish action to the user
- Zhihu: browser automation is too risky (account ban) — always manual paste
- If XHS login fails, tell the user to run `xhs-mcp login` and try again
- If any platform fails, report it clearly and ask whether to continue with the remaining platforms
