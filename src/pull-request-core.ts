import Octokit, { GitUpdateRefResponse } from '@octokit/rest'

import { PullRequest, PullRequestWithChangesetCommit, SourceFile } from './types'

class Client {
    private readonly octokit: Octokit

    constructor(gitHubAccessToken: string) {
        this.octokit = new Octokit({
            auth: gitHubAccessToken,
        })
    }

    public async issuePullRequest({
        pullRequest: pr,
        changesetCommit: cs,
    }: PullRequestWithChangesetCommit): Promise<Octokit.PullsCreateResponse> {
        const { sha: commitBranchSha } = await this.getCommitBranchSha(
            pr.sourceOwner,
            pr.sourceRepo,
            pr.destinationBranch,
            pr.sourceBranch
        )

        const { sha: treeSha } = await this.createTree(pr.sourceOwner, pr.sourceRepo, commitBranchSha, cs.sourceFiles)

        await this.pushCommit(
            pr.sourceOwner,
            pr.sourceRepo,
            pr.sourceBranch,
            commitBranchSha,
            treeSha,
            cs.authorName,
            cs.authorEmail,
            cs.commitMessage
        )

        return await this.createPullRequest(pr)
    }

    private async createPullRequest({
        sourceOwner,
        sourceRepo,
        destinationBranch,
        sourceBranch,
        subject,
        description,
        destinationOwner,
        destinationRepo,
        maintainerCanModify,
        draft,
    }: PullRequest): Promise<Octokit.PullsCreateResponse> {
        if (destinationOwner && destinationOwner !== sourceOwner) {
            destinationBranch = `${sourceOwner}:${destinationBranch}`
        } else {
            destinationOwner = sourceOwner
        }

        if (!destinationRepo) {
            destinationRepo = sourceRepo
        }

        const { data: pullResponse } = await this.octokit.pulls.create({
            owner: destinationOwner,
            repo: destinationRepo,
            title: subject,
            body: description,
            head: sourceBranch,
            base: destinationBranch,
            maintainer_can_modify: maintainerCanModify,
            draft,
        })

        return pullResponse
    }

    /**
     * Pushes a commit of treeSha to commitBranch and returns the response.
     */
    private async pushCommit(
        owner: string,
        repo: string,
        commitBranch: string,
        commitBranchSha: string,
        treeSha: string,
        authorName: string,
        authorEmail: string,
        commitMessage: string
    ): Promise<GitUpdateRefResponse> {
        const { data: parentCommit } = await this.octokit.git.getCommit({
            owner,
            repo,
            commit_sha: commitBranchSha,
        })

        const { data: createdCommit } = await this.octokit.git.createCommit({
            owner,
            repo,
            message: commitMessage,
            tree: treeSha,
            author: {
                name: authorName,
                email: authorEmail,
                date: new Date().toISOString(),
            },
            parents: [parentCommit.sha],
        })

        const { data: ref } = await this.octokit.git.updateRef({
            owner,
            repo,
            ref: 'heads/' + commitBranch,
            sha: createdCommit.sha,
        })

        return ref
    }

    /**
     * Creates a tree from the provided commitBranchSha ref for sourceFiles and returns the sha.
     */
    private async createTree(
        owner: string,
        repo: string,
        commitBranchSha: string,
        sourceFiles: SourceFile[]
    ): Promise<{ sha: string }> {
        const tree = sourceFiles.map<Octokit.GitCreateTreeParamsTree>(({ path, content }) => ({
            path,
            content,
            type: 'blob',
            mode: '100644',
        }))
        const { data } = await this.octokit.git.createTree({
            owner,
            repo,
            tree,
            base_tree: commitBranchSha,
        })

        return { sha: data.sha }
    }

    /** Creates a a commitBranch from baseBranch and returns the sha. */
    private async createCommitBranch(
        owner: string,
        repo: string,
        baseBranch: string,
        commitBranch: string
    ): Promise<{ sha: string }> {
        const { data: baseBranchRef } = await this.octokit.git.getRef({
            owner,
            repo,
            ref: 'heads/' + baseBranch,
        })
        const { data: commitBranchRef } = await this.octokit.git.createRef({
            owner,
            repo,
            ref: 'refs/heads/' + commitBranch,
            sha: baseBranchRef.object.sha,
        })
        return { sha: commitBranchRef.object.sha }
    }

    /**
     * Returns the commit branch sha ref (the one we will PR) if it exists, or creates it from the base branch and returns it.
     */
    private async getCommitBranchSha(
        owner: string,
        repo: string,
        baseBranch: string,
        commitBranch: string
    ): Promise<{ sha: string }> {
        try {
            const { data } = await this.octokit.git.getRef({
                owner,
                repo,
                ref: 'heads/' + commitBranch,
            })

            return data.object.sha
        } catch ({ status }) {
            // branch does not exist; create it.
            if (status === 404) {
                return await this.createCommitBranch(owner, repo, baseBranch, commitBranch)
            }
            throw new Error('Error looking up or creating branch. Is your GitHub token authorized?')
        }
    }
}

export async function issuePullRequestWithToken(
    { pullRequest, changesetCommit }: PullRequestWithChangesetCommit,
    gitHubAccessToken: string
): Promise<Octokit.PullsCreateResponse> {
    const client = new Client(gitHubAccessToken)

    return await client.issuePullRequest({ pullRequest, changesetCommit })
}
