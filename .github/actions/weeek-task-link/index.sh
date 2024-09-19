#!/bin/bash

PR_TITLE="${{ github.event.pull_request.title }}"

# Step 1: Extract task number from PR title
if [[ "$PR_TITLE" =~ \[#([0-9]+)\] ]]; then
  TASK_NUMBER="${BASH_REMATCH[1]}"
  echo "task_number=$TASK_NUMBER" >> $GITHUB_ENV
else
  echo "No task number found in the pull request title."
  exit 0
fi

# Step 2: Get task details from Weeek API
TASK_ID=${{ env.task_number }}
WORKSPACE_ID=${{ inputs.workspace_id }}
RESPONSE=$(curl -X GET \
  -H "Authorization: Bearer ${{ inputs.weeek_api_token }}" \
  -H "Content-Type: application/json" \
  "https://api.weeek.net/public/v1/tm/tasks/$TASK_ID")

SUCCESS=$(echo $RESPONSE | jq -r '.success')

if [[ "$SUCCESS" != "true" ]]; then
  echo "API request failed. Exiting."
  exit 1
fi

TASK_TITLE=$(echo $RESPONSE | jq -r '.task.title')

if [[ "$TASK_TITLE" == "null" || -z "$TASK_TITLE" ]]; then
  echo "Failed to get task title."
  exit 1
else
  echo "task_title=$TASK_TITLE" >> $GITHUB_ENV
fi

# Step 3: Add comment via GitHub API
PR_NUMBER="${{ github.event.pull_request.number }}"
TASK_URL="https://app.weeek.net/ws/${WORKSPACE_ID}/task/${{ env.task_number }}"
TASK_LINK="[${{ env.task_title }}]($TASK_URL)"

curl -X POST \
  -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \
  -H "Content-Type: application/json" \
  -d "{\"body\": \"$TASK_LINK\"}" \
  "https://api.github.com/repos/${{ github.repository }}/issues/$PR_NUMBER/comments"
