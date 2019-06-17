import { app, commands, configuration, ExtensionContext, search, NotificationType } from 'sourcegraph'
import { runCodemodQuery } from './codemod'
import { issuePullRequestWithToken } from './pull-request-core'
import { bundlePullRequests } from './user-input-sequence'

export function activate(ctx: ExtensionContext): void {
    // store the query string in configuration after a search. It's used to execute a GQL codemod command when we're ready to PR.
    ctx.subscriptions.add(
        search.registerQueryTransformer({
            transformQuery: async query => {
                await commands.executeCommand('updateConfiguration', 'pr.codemodQuery', query)
                return query
            },
        })
    )
    ctx.subscriptions.add(
        commands.registerCommand('pr.issuePullRequest', async (pullRequest, changesetCommit) => {
            const query = configuration.get().value['pr.codemodQuery']
            if (query) {
                if (!app.activeWindow) {
                    throw new Error('No active window')
                }
                app.activeWindow.showNotification(`🔥 Preparing your PR, hang on hot second`, NotificationType.Info)
                const sources = await runCodemodQuery(query)
                const bundles = await bundlePullRequests(sources)
                app.activeWindow.showNotification(`⚙️ The gears are turning...`, NotificationType.Info)
                for (const { pullRequestWithChangesetCommit, gitHubAccessToken } of bundles) {
                    await issuePullRequestWithToken(pullRequestWithChangesetCommit, gitHubAccessToken)
                }
                return
            }
            return
        })
    )
}
