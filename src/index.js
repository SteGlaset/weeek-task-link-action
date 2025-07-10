import * as core from '@actions/core';
import { fetch } from 'undici';

try {
    const weeekApiToken = core.getInput('weeek_api_token');
    const workspaceId = core.getInput('workspace_id');
    const githubToken = process.env.GITHUB_TOKEN;

    const eventPath = process.env.GITHUB_EVENT_PATH;
    const event = require(eventPath);

    const pr = event.pull_request;
    if (!pr) {
        throw new Error('This action must be run on pull_request event.');
    }

    const prTitle = pr.title;
    const prNumber = pr.number;
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

    const taskIds = [...prTitle.matchAll(/\[#(\d+)]/g)].map(match => match[1]);

    // Step 0: Remove previous comments with links
    void fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
        headers: {
            Authorization: `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github+json'
        }
    })
        .then(res => res.json())
        .then(comments => {
            for (const comment of comments) {
                const isBot = comment.user?.type === 'Bot';
                const hasWeeekLink = comment.body?.includes(`https://app.weeek.net/ws/${workspaceId}/task/`);

                if (isBot && hasWeeekLink) {
                    core.info(`Deleting comment ID ${comment.id}`);
                    fetch(`https://api.github.com/repos/${owner}/${repo}/issues/comments/${comment.id}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            'Content-Type': 'application/json',
                            Accept: 'application/vnd.github+json'
                        }
                    });
                }
            }
        });

    if (!taskIds.length) {
        core.info('No task number found in PR title.');
    }

    // Step 1: Add comment for each id in title
    for (const taskId of taskIds) {
        core.setOutput('task_number', taskId);

        fetch(`https://api.weeek.net/public/v1/tm/tasks/${taskId}`, {
            headers: {
                Authorization: `Bearer ${weeekApiToken}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(taskData => {
                if (!taskData.success || !taskData.task?.title) {
                    core.setFailed(`Could not retrieve task name with id ${taskId}.`);
                    return;
                }

                const taskTitle = taskData.task.title;
                core.setOutput('task_title', taskTitle);

                const taskLink = `https://app.weeek.net/ws/${workspaceId}/task/${taskId}`;
                const body = `🔗 [${taskTitle}](${taskLink})`;

                void fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ body })
                });

                core.info(`Comment for task with id ${taskId} posted successfully.`);
            });
    }
} catch (error) {
    core.setFailed(error.message);
}
