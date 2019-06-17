import * as sourcegraph from 'sourcegraph'
import { PullRequestBundle, SourceTree } from './types'

export async function bundlePullRequests(sourceTrees: SourceTree[]): Promise<PullRequestBundle[]> {
    async function getConfValueOrPrompt(key: string, prompt: string, placeholder?: string): Promise<string> {
        if (!sourcegraph.app.activeWindow) {
            throw new Error('No active window')
        }

        const value =
            sourcegraph.configuration.get().value[key] !== undefined
                ? sourcegraph.configuration.get().value[key]
                : await sourcegraph.app.activeWindow.showInputBox({
                      prompt,
                      value: placeholder,
                  })
        if (value === undefined) {
            throw new Error('Pull request canceled.')
        }
        return value
    }

    const bundles: PullRequestBundle[] = []

    for (const { owner, repo, sourceFiles } of sourceTrees) {
        if (!sourcegraph.app.activeWindow) {
            throw new Error('No active window')
        }
        await sourcegraph.app.activeWindow.showMessage(`PR for ${owner}/${repo}`)

        const gitHubAccessToken = await getConfValueOrPrompt('pr.gitHubAccessToken', 'GitHub Access Token:')
        const subject = await getConfValueOrPrompt('pr.title', 'Pull Request Title:', 'codemod:')
        const description = await getConfValueOrPrompt('pr.description', 'Pull Request Description:', '...')
        const commitMessage = await getConfValueOrPrompt(
            'pr.commitMessage',
            'Commit Message:',
            sourcegraph.configuration.get().value['pr.codemodQuery']
        )
        const authorName = await getConfValueOrPrompt('pr.authorName', 'Author Name:')
        const authorEmail = await getConfValueOrPrompt('pr.authorEmail', 'Author Email:')
        const sourceBranch = await getConfValueOrPrompt(
            'pr.sourceBranch',
            'This feature branch name (e.g., my-codemod-branch):'
        )

        // Don't prompt the branch this PR is made against: assume the default is 'master' if not specified in config.
        const destinationBranch = sourcegraph.configuration.get().value['pr.destinationBranch'] || 'master'

        // Don't prompt whether this is a draft: assume it is unless overriden in config.
        const isDraft = sourcegraph.configuration.get().value['pr.isDraft']
        const draft = isDraft === undefined ? true : isDraft

        // use owner and repo of origin to PR against
        const pullRequest = {
            sourceOwner: owner,
            sourceRepo: repo,
            destinationBranch,
            sourceBranch,
            subject,
            description,
            draft,
        }

        const commitMetaData = {
            authorName,
            authorEmail,
            commitMessage,
        }

        const bundle: PullRequestBundle = {
            pullRequestWithChangesetCommit: {
                pullRequest,
                changesetCommit: { commitMetaData, sourceFiles },
            },
            gitHubAccessToken,
        }

        bundles.push(bundle)
    }

    return bundles
}
