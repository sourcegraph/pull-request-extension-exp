export interface Overrides {
    /**
     * An input box is prompted if not specified.
     */
    'pr.gitHubAccessToken': string

    /**
     * An input box is prompted if not specified.
     */
    'pr.title': string

    /**
     * An input box is prompted if not specified.
     */
    'pr.description': string

    /**
     * An input box is prompted if not specified.
     */
    'pr.authorName': string

    /**
     * An input box is prompted if not specified.
     */
    'pr.authorEmail': string

    /**
     * E.g., my-pr-branch. An input box is prompted if not specified.
     */
    'pr.sourceBranch': string

    /**
     * Default is 'master' if not specified.
     */
    'pr.destinationBranch': string

    /**
     * A PR is a draft by default. Set this to false to issue real PRs.
     */
    'pr.isDraft': boolean

    /**
     * Override sourcegraph URL (useful to for testing against Docker hosts).
     */
    'pr.sourcegraphUrl': string
}

export type Settings = Partial<Overrides>
