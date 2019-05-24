import * as sourcegraph from 'sourcegraph'
import { issuePullRequestWithToken } from './pull-request-core'

/**
 * The activate function is called when one of the extensions `activateEvents`
 * conditions in package.json are satisfied.
 */
export function activate(ctx: sourcegraph.ExtensionContext): void {
    // const gitHubAccessToken = sourcegraph.configuration
    //    .get()
    //    .get('github.pr.accessToken')
    // if (!gitHubAccessToken) {
    //    console.log('Could not read github.pr.accessToken from configuration')
    //    return;
    // }

    const gitHubAccessToken = 'YOUR_GH_TOKEN'
    ctx.subscriptions.add(
        sourcegraph.commands.registerCommand('pr.issuePullRequest', (pullRequest, changesetCommit) =>
            issuePullRequestWithToken({ pullRequest, changesetCommit }, gitHubAccessToken)
        )
    )
}
