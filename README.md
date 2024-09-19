# 🖋 Weeek Task Link Action

## Description

This GitHub Action automatically adds a link to a Weeek task in the comments of a Pull Request if the task number is included in the PR title. It simplifies linking Weeek tasks to code changes, helping teams quickly locate the related tasks associated with each Pull Request.

## How It Works

1. The action extracts the task number from the PR title in the format `[#{task_number}]`.
2. It makes a request to the Weeek API to retrieve the task title.
3. A comment with the Weeek task link and its title is automatically added to the Pull Request.

## Usage Example

```yaml
name: Add Weeek task link to PR

on:
  pull_request:
    types: [opened, edited]

jobs:
  add-task-link:
    runs-on: ubuntu-latest
    steps:
      - name: Add Weeek task link
        uses: SteGlaset/weeek-task-link-action@v1.0.1
        with:
          weeek_api_token: ${{ secrets.WEEEK_API_TOKEN }}
          workspace_id: ${{ secrets.WEEEK_WORKSPACE_ID }}
```

## Requirements

* The PR title must contain the Weeek task number in the format `[#{task_number}]`.
* A Weeek API token is required and should be stored as a secret `WEEEK_API_TOKEN` in the repository settings.
* The ID of your Weeek workspace is required and should be stored as a secret `WEEEK_WORKSPACE_ID`.

## Inputs

* `weeek_api_token` (required) — The API token to authenticate with Weeek.
* `workspace_id` (required) — The ID of your Weeek workspace.

## Outputs

* `task_number` — The task number extracted from the PR title.
* `task_title` — The task title retrieved from the Weeek API.

## Benefits

* Enhances the connection between tasks in the Weeek project management system and the code review process on GitHub.
* Improves transparency by allowing team members to easily track the tasks associated with specific code changes.

## Compatibility

* Works on `ubuntu-latest`.

## License
This action is licensed under the MIT License.
