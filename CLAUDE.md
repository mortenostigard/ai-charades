# Claude guidelines for this repo

## Pull request merging

Never merge a PR until the user explicitly says they have approved it
in the GitHub UI. Do not call `mcp__github__merge_pull_request`
otherwise — not even speculatively.

If the user says "merge it" without confirming approval, ask whether
they have approved the PR first.
