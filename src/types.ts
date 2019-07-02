export namespace PullRequest {
    export interface CommitMetaData {
        /**
         * The author name associated with the commit and pull request.
         */
        authorName: string

        /**
         * The author email associated with the commit and pull request.
         */
        authorEmail: string

        /*
         * The commit message of the associated commit for this pull request.
         */
        commitMessage: string
    }

    export interface ChangesetCommit {
        /**
         * The source files that are updated in this pull request.
         */
        sourceFiles: SourceFile[]

        /**
         * Commit metadata like author name and commit message
         */
        commitMetaData: CommitMetaData
    }

    export interface GitHubPullRequest {
        /**
         * The repository owner of the repo to pull request against (a GitHub org or username).
         * If sourceOwner is not specified, then the sourceOwner is also the destinationOwner,
         * meaning the pull request is made against
         * the same GitHub or user account.
         */
        sourceOwner: string

        /**
         * The repository name to pull request against.
         * If sourceRepo is not specified, then the sourceRepo is also the destinationRepo, meaning the pull request
         * is made against the same repository.
         */
        sourceRepo: string

        /**
         * The destination branch to pull request against (such as `master`).
         */
        destinationBranch: string

        /**
         * The source branch this pull request is made from (such as `my-feature-branch`).
         */
        sourceBranch: string

        /**
         * The Pull Request subject (or title).
         */
        subject: string

        /**
         * The Pull Request description.
         */
        description?: string

        /**
         * The repository owner this pull request is made from.
         * If not specified then the sourceOwner is also the destinationOwner.
         */
        destinationOwner?: string

        /**
         * The repository name this pull request is made from.
         * If not specified then the sourceRepo is also the destinationRepo.
         */
        destinationRepo?: string

        /**
         * Whether the maintainer of the repository this pull request is made against can modify the pull request.
         */
        maintainerCanModify?: boolean

        /**
         * Whether this pull request is a draft.
         */
        draft?: boolean
    }

    export interface PullRequestWithChangesetCommit {
        /**
         * The pull request data.
         */
        pullRequest: GitHubPullRequest

        /**
         * The changeset, branch, and commit data associated with this pull request.
         */
        changesetCommit: ChangesetCommit
    }
}

export interface SourceFile {
    /**
     * File path in the git repository tree
     */
    path: string
    /**
     * File content
     */
    content: string
}

export interface Change {
    owner: string
    repo: string
    path: string
    patch: string
}

export interface SourceTree {
    owner: string
    repo: string
    sourceFiles: SourceFile[]
}

export interface Match {
    url: string
    body: {
        text: string
    }
}

export interface PullRequestBundle {
    pullRequestWithChangesetCommit: PullRequest.PullRequestWithChangesetCommit
    gitHubAccessToken: string
}
